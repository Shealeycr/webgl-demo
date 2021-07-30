
'use strict';

//#region Fields

var m_oScene, m_oGizmoScene, m_oRenderer, m_oOrbitRaycaster;
var m_oEventList;

var m_oOrbitCamera;

var m_fGridDimensions = 1000.0;
var m_fGridSpacing = 50.0;
var m_oGridMesh, m_oAxisMesh;
var m_oCircleMesh;

var m_oTranslationGizmo;

var m_oGLModels;
var m_oShip;

var m_oSelectedModels;

//#endregion

init();
Render();

//Initializer
function init() {
    
    m_oScene = new THREE.Scene();
    m_oGizmoScene = new THREE.Scene();

    m_oEventList = new Array();
    m_oGLModels = new Array();

    window.addEventListener('resize', onWindowResize, false);

    m_oOrbitCamera = new PerspectiveCamera();
    m_oOrbitCamera.UpdateTransform();
    m_oEventList.push(m_oOrbitCamera);
    m_oScene.add(m_oOrbitCamera.getGLCamera());
    
    m_oOrbitRaycaster = new Raycaster(m_oOrbitCamera.getGLCamera());
    m_oEventList.push(m_oOrbitRaycaster);

    CreateGrid();
    CreateCircle();
    CreateGizmos();
    

    //#region Add Cube & Sphere
        
    var oCubeModel = new ModelEntity(new THREE.BoxGeometry(1, 1, 1), newPlaneMaterial());
    oCubeModel.getGLMesh().position.set(80, -75, 5);
    oCubeModel.getGLMesh().scale.set(15, 15, 15);
    oCubeModel.getGLMesh().name = "Cube";
    oCubeModel.getGLMesh().material.opacity = 1;
    oCubeModel.UpdateBoundingBox();

    m_oScene.add(oCubeModel.getGLMesh());
    m_oScene.add(oCubeModel.getBoundingBox().getBoxMesh());
    
        
    var oSphereModel = new ModelEntity(new THREE.SphereGeometry(5, 32, 32), newPlaneMaterial());
    oSphereModel.getGLMesh().position.set(50, -75, 5);
    oSphereModel.getGLMesh().name = "Sphere";
    oSphereModel.getGLMesh().material.opacity = 0.75;
    oSphereModel.UpdateBoundingBox();

    m_oScene.add(oSphereModel.getGLMesh());
    m_oScene.add(oSphereModel.getBoundingBox().getBoxMesh());
    
    AddModel(oCubeModel);
    AddModel(oSphereModel);
   
    //#endregion

    //#region OBJ Objects

    var manager = new THREE.LoadingManager();
    manager.onProgress = function (item, loaded, total) {
        console.log(item, loaded, total);
    };
    var loader = new THREE.OBJLoader(manager);
    var onProgress = function (xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };
    var onError = function (xhr) {
    };

    loader.load( '3DModels/destroyer_tris.obj', function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material = newPlaneMaterial();
                child.material.opacity = 0.25;
            }
        });
        
        object.rotation.x = 1.570796;
        m_oScene.add(object);
    }, onProgress, onError);

    loader.load('3DModels/teapot.obj', function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {

                var thing = new ModelEntity(child.geometry, newPlaneMaterial());
                thing.getGLMesh().material.opacity = 0.5;
                thing.getGLMesh().position.set(75, -125, 10);
                thing.getGLMesh().rotation.x = 1.570796;
                thing.getGLMesh().name = "teapot";
                thing.UpdateBoundingBox();
                AddModel(thing);
            }
        });

        m_oScene.add(m_oGLModels[m_oGLModels.length - 1].getGLMesh());
        m_oScene.add(m_oGLModels[m_oGLModels.length - 1].getBoundingBox().getBoxMesh());
    }, onProgress, onError);

    //#endregion

    RegisterModels();

    for (var i = 0; i < m_oGLModels.length; i++)
    {
        m_oEventList.push(m_oGLModels[i]);
    }

    m_oSelectedModels = new Array();

    m_oRenderer = new THREE.WebGLRenderer();
    m_oRenderer.setSize(window.innerWidth, window.innerHeight);
    m_oRenderer.setClearColor(0x143A66, 1.0);
    m_oRenderer.autoClear = false;
    m_oRenderer.domElement.style.position = "absolute";
    m_oRenderer.domElement.style.left = "0px";
    m_oRenderer.domElement.style.top = "0px";
    m_oRenderer.domElement.addEventListener('mousedown', onMouseDown);
    m_oRenderer.domElement.addEventListener('mouseup', onMouseUp);
    m_oRenderer.domElement.addEventListener('mousemove', onMouseMove);
    m_oRenderer.domElement.addEventListener('mouseout', onMouseOut);
    m_oRenderer.domElement.addEventListener('mousewheel', onMouseWheel);
    m_oRenderer.domElement.addEventListener( 'touchstart', touchstart, false );
    m_oRenderer.domElement.addEventListener( 'touchend', touchend, false );
    m_oRenderer.domElement.addEventListener( 'touchmove', touchmove, false );
    
    document.oncontextmenu = function(event){
		event.preventDefault();
	    event.stopPropagation();
	    return false;
	};
    
    var directionalLight = new THREE.DirectionalLight(0xFFFFFF);
    directionalLight.position.set(-40, -60, 50);
    m_oScene.add(directionalLight);

    var directionalLight2 = new THREE.DirectionalLight(0xFFFFFF);
    directionalLight2.position.set(40, 60, -50);
    m_oScene.add(directionalLight2);

    document.body.appendChild(m_oRenderer.domElement);
}

//#region RenderLoop
function Render() {

    requestAnimationFrame(Render);
    
    var cirlcePos = m_oOrbitCamera.getOrigin();
    m_oCircleMesh.position.set(cirlcePos.x, cirlcePos.y, cirlcePos.z);
    
    m_oSelectedModels = new Array();
    for (var i = 0; i < m_oGLModels.length; i++)
    {
        if (m_oGLModels[i].getIsSelected())
        {
            m_oSelectedModels.push(m_oGLModels[i]);
        }
    }

    for (var i = 0; i < m_oGLModels.length; i++) {
        m_oGLModels[i].UpdateColors();
    }

    m_oRenderer.clear();
    m_oRenderer.render(m_oScene, m_oOrbitCamera.getGLCamera());

    for (var i = 0; i < m_oGLModels.length; i++)
    {
        GizmoTransforms(m_oGLModels[i]);
    }

    if (m_oSelectedModels.length > 0)
    {
        UpdateGizmos(m_oOrbitCamera);

        m_oRenderer.clearDepth();
        m_oRenderer.render(m_oGizmoScene, m_oOrbitCamera.getGLCamera());
    }
}

function onWindowResize() {
    
    m_oOrbitCamera.Resize();
    m_oRenderer.setSize(window.innerWidth, window.innerHeight);
}

//#endregion

//#region RenderTools

function CreateGrid()
{
    m_fGridDimensions /= 2;

    var numberOfLines = Math.ceil((m_fGridDimensions / 2.0) / m_fGridSpacing);
    numberOfLines *= 2;

    if (numberOfLines % 2 == 0)
        numberOfLines++;

    numberOfLines *= 2;
    numberOfLines -= 2;

    m_oGridMesh = new THREE.GridHelper(m_fGridDimensions, numberOfLines, new THREE.Color(0.59, 0.59, 0.59), new THREE.Color(0.427, 0.631, 0.894));
    m_oGridMesh.rotation.x = 1.570796;
    m_oScene.add(m_oGridMesh);

    m_oAxisMesh = new THREE.AxisHelper(1000);
    m_oAxisMesh.scale.y = 0;
    m_oAxisMesh.scale.x = 0;
    m_oScene.add(m_oAxisMesh);

    m_fGridDimensions *= 2;
}

function CreateCircle()
{
    var curve = new THREE.EllipseCurve(
        0, 0,
        1, 1,
        0, 2 * Math.PI,
        false, 0
        );

    var path = new THREE.Path(curve.getPoints(50));
    var oCircleGeometry = path.createPointsGeometry(50);
    var oCircleMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(0, 1, 0) });

    m_oCircleMesh = new THREE.Line(oCircleGeometry, oCircleMaterial);
    var position = m_oOrbitCamera.getOrigin();
    m_oCircleMesh.position.set(position.x, position.y, position.z);
    m_oScene.add(m_oCircleMesh);
}

function CreateGizmos()
{
    m_oTranslationGizmo = new TranslationGizmo();
    m_oGizmoScene.add(m_oTranslationGizmo.getXCone().getGLMesh());
    m_oGizmoScene.add(m_oTranslationGizmo.getYCone().getGLMesh());
    m_oGizmoScene.add(m_oTranslationGizmo.getZCone().getGLMesh());
    m_oGizmoScene.add(m_oTranslationGizmo.getLines());
}

function GizmoTransforms(oModel)
{
    if (m_oSelectedModels.length == 0)
    {
        m_oTranslationGizmo.Reset();

        m_oOrbitCamera.setStaticCamera(false);
    }
    else if (oModel.getIsSelected())
    {
        m_oTranslationGizmo.setPosition(oModel.getGLMesh().position);

        if (m_oTranslationGizmo.getXCone().getIsSelected() || m_oTranslationGizmo.getYCone().getIsSelected() || m_oTranslationGizmo.getZCone().getIsSelected()) {
            m_oOrbitCamera.setStaticCamera(true);
            oModel.Translate(m_oTranslationGizmo, m_oOrbitCamera, m_fGridDimensions);
        }
        else
            m_oOrbitCamera.setStaticCamera(false);
    }
}

function UpdateGizmos(oCamera)
{
    m_oTranslationGizmo.Update(oCamera);
}

function RegisterModels()
{
    var oModelsToRegister = new Array();

    for (var i = 0; i < m_oGLModels.length; i++)
    {
        oModelsToRegister.push(m_oGLModels[i]);
    }

    oModelsToRegister.push(m_oTranslationGizmo.getXCone());
    oModelsToRegister.push(m_oTranslationGizmo.getYCone());
    oModelsToRegister.push(m_oTranslationGizmo.getZCone());

    m_oOrbitRaycaster.SetModels(oModelsToRegister);
}

function AddModel(oModel)
{
    m_oEventList.push(oModel);
    m_oGLModels.push(oModel);

    RegisterModels();
}

function newPlaneMaterial()
{
    return new THREE.MeshLambertMaterial({ color: 0x969696, side: THREE.DoubleSide, opacity: 0.5, transparent: true, depthWrite: true });
}

//#endregion

//#region InputEvents

function touchstart( event ) {
    m_oOrbitCamera.touchstart(event);
}

function touchmove( event ) {
    m_oOrbitCamera.touchmove(event);
}

function touchend() {
    m_oOrbitCamera.touchend(event);
}

function onMouseDown(event) {
    event.preventDefault();

    for (var i = 0; i < m_oEventList.length; i++)
    {
        m_oEventList[i].onMouseDown(event);
    }
}

function onMouseUp(event) {
    event.preventDefault();

    for (var i = 0; i < m_oEventList.length; i++) {
        m_oEventList[i].onMouseUp(event);
    }
}

function onMouseMove(event) {
    event.preventDefault();

    for (var i = 0; i < m_oEventList.length; i++) {
        m_oEventList[i].onMouseMove(event);
    }
}

function onMouseOut(event) {
    event.preventDefault();

    for (var i = 0; i < m_oEventList.length; i++) {
        m_oEventList[i].onMouseOut(event);
    }
}

function onMouseWheel(event) {
    event.preventDefault();

    for (var i = 0; i < m_oEventList.length; i++) {
        m_oEventList[i].onMouseWheel(event);
    }
}

//#endregion