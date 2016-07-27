/**
 * Created on 2016-07-22.
 */
"use strict";
function loadModels(BABYLON, vm){

  const filename = "KidsPrin_CeFan_Wd_LtPurp_001.zip";
  //const filename = "West_Chair_Leath_Brown_001.zip";
  const space =1.4;

  vm.testloadModelZip({
    filename: filename,
    physics: false,
    success: function(a_item){

      let mesh = a_item.meshes[1];
      mesh.e_siblings = null;

      for (let x = -10; x < 10; ++x) {
        for (let z = -5; z < 5; ++z) {
          let position = new BABYLON.Vector3(space * x, 1, space * z);
          let rotation = BABYLON.Quaternion.RotationYawPitchRoll(0, 0, 0);

          let instance = mesh.createInstance(x + " " + z);
          instance.position = position;
          instance.__mesh = mesh;
          instance.tag = 1;
          instance.label = x + " " + z;
          vm.addToShadowGenerator(instance);

        }
      }
    }
  });


}

export default function(BABYLON, vm){
  loadModels(BABYLON, vm);
}
