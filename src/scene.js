import * as BABYLON from 'babylonjs'
const track1 = require('./assets/Track1.mp3')
const track2 = require('./assets/Track2.mp3')
const track3 = require('./assets/Track3.mp3')
const track4 = require('./assets/Track4.mp3')
const track5 = require('./assets/Track5.mp3')
const lake = require('./lake.json')

const createScene = function (canvas) {
//   const canvas = document.getElementById('renderCanvas')

  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    scene.createDefaultCamera(true);
    // here the doc for Load function: //doc.babylonjs.com/typedoc/classes/babylon.sceneloader#load
    // "https://raw.githubusercontent.com/geonom/blender_exporter_test/main/Lake.babylon"
    BABYLON.SceneLoader.Load("", lake, engine, function (scene) {

      //LICENSE: Any code herein including the comments is in the public domain
      // The linked to libraries are governed by their own respective licenses
      // All linked to images and sounds are in the public domain as well

      scene.clearColor = new BABYLON.Color3(1, 1, 1);
      scene.ambientColor = new BABYLON.Color3.White();

      // implement the sounds

      // this one is the background music, therefore autoplay and loop are true
      const sound = new BABYLON.Sound("Background music", track1, scene, null, {
          loop: true,
          autoplay: true
      });

      // the other sounds should only be played once triggered, therefore autoplay is false
      // they are not supposed to loop, therefore loop is false
      const sound1 = new BABYLON.Sound("1", track2, scene, null, {
          loop: false,
          autoplay: false
      });

      const sound4 = new BABYLON.Sound("4", track5, scene, null, {
          loop: false,
          autoplay: false
      });

      const sound2 = new BABYLON.Sound("2", track3, scene, null, {
          loop: false,
          autoplay: false
      });

      const sound3 = new BABYLON.Sound("3", track4, scene, null, {
          loop: false,
          autoplay: false
      });


      // The universal camera - Parameters : name, position, scene
      var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(9, -20, -21), scene);
      // Targets the camera to a particular target position, in this case the first house
      camera.setTarget(new BABYLON.Vector3(10, -20, -18.1));
      // Attach the camera to the canvas
      camera.attachControl(canvas, true);
      // set the camera to be active in the scene
      scene.activeCamera = camera

      // these calculations are for movement speed and gravity
      const assumedFramesPerSecond = 60;
      const earthGravity = -9.81;
      scene.gravity = new BABYLON.Vector3(0, earthGravity / assumedFramesPerSecond, 0);
      camera.applyGravity = true;
      camera.speed = 0.75;
      camera.inertia = 0.75;

      // the shape of the ellipsoid around the camera used for collision with other objects
      camera.ellipsoid = new BABYLON.Vector3(1.5, 1.6, 1.5);

      // Enable Collisions
      scene.collisionsEnabled = true;
      camera.checkCollisions = true;

      scene.getNodeByName("Ground").checkCollisions = true;

      // set collision for all houses, trees and christmas objects
      for (let i = 0; i < scene.meshes.length; i++) {
          let mesh = scene.meshes[i];
          if (mesh.name.indexOf("House") > -1) {
              mesh.checkCollisions = true;
          }
          if (mesh.name.indexOf("Tree") > -1) {
              mesh.checkCollisions = true;
          }
          if (mesh.name.indexOf("Christmas") > -1) {
              mesh.checkCollisions = true;
          }
      }

      // set the collision for the movement bounds mesh
      // and set its visibility to zero
      // and set pickable to false, so that actionable objects inside the bounds
      // can be activated by clicking (if true [default], the clicks would be consumed
      // by the bounds and not be delivered to clickable objects like houses inside the bounds)
      scene.getNodeByName("Bounds").visibility = 0.0;
      scene.getNodeByName("Bounds").checkCollisions = true;
      scene.getNodeByName("Bounds").isPickable = false;


      //Hemilight to illuminate the snowy day
      var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      light.diffuse = new BABYLON.Color3(0.4, 0.76, 0.97);
      light.groundColor = new BABYLON.Color3(.5, .5, .5);




      // Particle system for snow
      var myParticleSystem;

      // try to start a GPU particle system, alternatively use the CPU
      if (BABYLON.GPUParticleSystem.IsSupported) {
          myParticleSystem = new BABYLON.ParticleHelper.CreateDefault(
               new BABYLON.Vector3(0, 26, 0), 1000000, scene, true);
          myParticleSystem.activeParticleCount = 200000;
          myParticleSystem.emitRate = 10000;
          console.log("Using GPU particles")
      } else {
          myParticleSystem = new BABYLON.ParticleSystem("particles", 50000, scene);
          console.log("Using CPU particles")
          myParticleSystem.emitRate = 4000;
      }

      // set the emitter box
      myParticleSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100); // minimum box dimensions
      myParticleSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100); // maximum box dimensions

      myParticleSystem.minSize = .07;
      myParticleSystem.maxSize = .08;
      myParticleSystem.minLifeTime = 20;
      myParticleSystem.maxLifeTime = 20;

      myParticleSystem.minEmitPower = -2;
      myParticleSystem.maxEmitPower = -3;
      myParticleSystem.applyGravity = true;

      // add movement noise to the snow particles
      var noiseTexture = new BABYLON.NoiseProceduralTexture("perlin", 256, scene);
      noiseTexture.animationSpeedFactor = 5;
      noiseTexture.persistence = 2;
      noiseTexture.brightness = 0.5;
      noiseTexture.octaves = 5;
      myParticleSystem.noiseTexture = noiseTexture;
      myParticleSystem.noiseStrength = new BABYLON.Vector3(1, 0.03, 1);

      myParticleSystem.start();

      // Add actions to all houses and the sledge

      // lower the visibility of the christmas objects until the house was clicked
      var meshChristmasTree = scene.getMeshByName("Christmas Tree");
      meshChristmasTree.visibility = 0.1;

      scene.getMeshByName("House 1").actionManager = new BABYLON.ActionManager(scene);

      // The executeCodeAction allows to execute multiple functions easily upon OnPickTrigger
      scene.getMeshByName("House 1").actionManager.registerAction(
          new BABYLON.ExecuteCodeAction({
              trigger: BABYLON.ActionManager.OnPickTrigger,
              parameter: scene.getMeshByName("House 1")
          },
              function () {
                  sound1.play();
                  meshChristmasTree.visibility = 1;
              }
          )
      );

      var meshChristmasLamps = scene.getMeshByName("Christmas Lamps");
      meshChristmasLamps.visibility = 0.0;
      scene.getMeshByName("House 2").actionManager = new BABYLON.ActionManager(scene);
      scene.getMeshByName("House 2").actionManager.registerAction(
          new BABYLON.ExecuteCodeAction({
              trigger: BABYLON.ActionManager.OnPickTrigger,
              parameter: scene.getMeshByName("House 2")
          },
              function () {
                  sound2.play();
                  meshChristmasLamps.visibility = 1.0;
              }
          )
      );

      var meshChristmasWreath = scene.getMeshByName("Christmas Wreath");
      meshChristmasWreath.visibility = 0.0;

      scene.getMeshByName("House 1.1").actionManager = new BABYLON.ActionManager(scene);
      scene.getMeshByName("House 1.1").actionManager.registerAction(
          new BABYLON.ExecuteCodeAction({
              trigger: BABYLON.ActionManager.OnPickTrigger,
              parameter: scene.getMeshByName("House 1.1")
          },
              function () {
                  sound3.play();
                  meshChristmasWreath.visibility = 1.0;
              }
          )
      );

      var meshChristmasStar = scene.getMeshByName("Christmas Star");
      var meshChristmasStar1 = scene.getMeshByName("Christmas Star 1");
      var meshChristmasStar2 = scene.getMeshByName("Christmas Star 2");

      meshChristmasStar.visibility = 0.0;
      meshChristmasStar1.visibility = 0.0;
      meshChristmasStar2.visibility = 0.0;

      scene.getMeshByName("House 1.2").actionManager = new BABYLON.ActionManager(scene);
      scene.getMeshByName("House 1.2").actionManager.registerAction(
          new BABYLON.ExecuteCodeAction({
              trigger: BABYLON.ActionManager.OnPickTrigger,
              parameter: scene.getMeshByName("House 1.2")
          },
              function () {
                  sound4.play();
                  meshChristmasStar.visibility = 1.0;
                  meshChristmasStar1.visibility = 1.0;
                  meshChristmasStar2.visibility = 1.0;
                  scene.beginAnimation(scene.getMeshByName("Train"), 0, 2400, true);
              }
          )
      );


      var meshChristmasSledgeText = scene.getMeshByName("Text Sledge");
      meshChristmasSledgeText.visibility = 0.0

      scene.getMeshByName("Christmas Sledge").actionManager = new BABYLON.ActionManager(scene);
      scene.getMeshByName("Christmas Sledge").actionManager.registerAction(
          new BABYLON.ExecuteCodeAction({
              trigger: BABYLON.ActionManager.OnPickTrigger,
              parameter: scene.getMeshByName("Christmas Sledge")
          },
              function () {
                  meshChristmasSledgeText.visibility = 1.0;
              }
          )
      );



      // Add glow to objects with emission materials
      var gl = new BABYLON.GlowLayer("glow", scene);
      gl.intensity = 0.7;




      // // Create SSAO and configure all properties (for the example)
      // var ssaoRatio = {
      //     ssaoRatio: 0.5, // Ratio of the SSAO post-process, in a lower resolution
      //     combineRatio: 1.0 // Ratio of the combine post-process (combines the SSAO and the scene)
      // };

      // var ssao = new BABYLON.SSAORenderingPipeline("ssao", scene, ssaoRatio);
      // ssao.fallOff = 0.00001;
      // ssao.area = 0.3;
      // ssao.radius = 0.00001;
      // ssao.totalStrength = .7;
      // ssao.base = 0.5;



      // Add fog
      scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
      scene.fogColor = scene.clearColor;
      scene.fogStart = 50.0;
      scene.fogEnd = 120.0;

      engine.runRenderLoop(function () {
          scene.render();
      });


      window.addEventListener("resize", function () {
          engine.resize();
      });
  });

  return scene;
};

export default createScene;