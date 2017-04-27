var _tmpVector3 = new BABYLON.Vector3( 0, 0, 0);
var _tmpQuaternion = new BABYLON.Quaternion( 0, 0, 0, 1 );
/**
 * @typedef {{x:Number, y:Number}} Vector2
 */
// Constant stored for the upVector
const upVector3 = BABYLON.Vector3.Up();
const forwardVector3 = BABYLON.Vector3.Forward();
const toDegrees = 180 / Math.PI;
const toRadians = Math.PI / 180;


/**
 * Multiply quat quaternion with vector3
 * @param {BABYLON.Quaternion} quat
 * @param {BABYLON.Vector3} vec3
 * @param {undefined|BABYLON.Vector3} ref Uses math._tmpVector3 if undefined
 * @returns {BABYLON.Vector3}
 */
var multiplyVector3 = function ( quat, vec3, ref ) {
  if ( !ref ) {
    ref = _tmpVector3
  }

  const vx = vec3.x;
  const vy = vec3.y;
  const vz = vec3.z;
  const qx = quat.x;
  const qy = quat.y;
  const qz = quat.z;
  const qw = quat.w;

  const i = qw * vx + qy * vz - qz * vy;
  const j = qw * vy + qz * vx - qx * vz;
  const k = qw * vz + qx * vy - qy * vx;
  const l = -qx * vx - qy * vy - qz * vz;

  ref.x = i * qw + l * -qx + j * -qz - k * -qy;
  ref.y = j * qw + l * -qy + k * -qx - i * -qz;
  ref.z = k * qw + l * -qz + i * -qy - j * -qx;
  
  return ref;
};

// Source: http://www.euclideanspace.com/maths/algebra/vectors/angleBetween/index.htm
/**
 * Get the rotation to transform the vector a to b.
 * @param {BABYLON.Vector3} a
 * @param {BABYLON.Vector3} b
 * @param {BABYLON.Quaternion|undefined} ref
 * @return {BABYLON.Quaternion}
 */
var lookAtRotationToRef = function ( a, b, ref ) {

  const dot = BABYLON.Vector3.Dot( a, b );
  const angle = Math.acos( dot );

  let axis = _tmpVector3;
  BABYLON.Vector3.CrossToRef( a, b, axis );

  BABYLON.Quaternion.RotationAxisToRef( axis, angle, ref );
  ref.normalize();
  return ref;
};

/***********************************
 * Find surface rotations with rays
 **********************************/

// Source of base implementation: http://www.html5gamedevs.com/topic/11172-rotate-an-object-perpendicular-to-the-surface-of-a-sphere/
/**
 * Get the surface rotation based of input normal.
 * @param {BABYLON.Vector3} normal
 * @param {undefined|BABYLON.Quaternion} rotationRef Uses Tmp.Quaternion[ 0 ] if undefined
 * @returns {BABYLON.Quaternion}
 */
var getSurfaceRotation = function ( normal, rotationRef ) {
  if ( !rotationRef ) {
    rotationRef = _tmpQuaternion
  }

  // For normal.y = 1 return identity quaternion
  if ( normal.y === 1 ) {
    rotationRef.copyFromFloats(0, 0, 0, 1);
  }
  // For normal.y == 1 then return a quaternion to turn it upside down
  else if ( normal.y === -1 ) {
    rotationRef.copyFromFloats(0, 0, 1, 0);
  } else {
    lookAtRotationToRef( upVector3, normal, rotationRef );
  }

  return rotationRef;
};


var getViewRotation = function ( rotValue, cameraViewMatrix, x, y, z ) {
  // The rotation speed is 1 lapse every 3 second
  // Why it's / 1.5 I am not sure of. ¯\_(ツ)_/¯
  // Math.PI * 2 = 1 rotation / 2
  var axis = BABYLON.Tmp.Vector3[ 0 ].copyFromFloats( x, y, z );

  var viewRotation = BABYLON.Tmp.Quaternion[ 0 ];
  // const viewRotation = BABYLON.Quaternion.FromRotationMatrix( camera._cameraRotationMatrix );
  BABYLON.Quaternion.FromRotationMatrixToRef( cameraViewMatrix, viewRotation );

  // Inverse it to cause the axis to have proper direction.  Otherwise they are flipped
  viewRotation.conjugateInPlace();

  // Convert axises to viewspace
  multiplyVector3( viewRotation, axis, axis );

  // TODO: In babylon 2.5 change to use RotationAxisRef
  return BABYLON.Quaternion.RotationAxis( axis, rotValue );
};

/**
 * Try and round a value to zero if it's like 1.3487523859e-15
 * @param {number} value
 * @returns {number}
 */
var tryRoundToZero = function ( value ) {
  let absValue = Math.abs( value );
  // If greater than 10^-8
  if ( absValue < 0.000001 ) {
    return 0;
  }
  // Otherwise return the original value
  return value;
};

/**
 *  Takes a value and a snapInterval as input.
 *  For example value = 1.25, snapInterval = 0.5
 *  Output: 1.5
 * @param {number} value
 * @param {number} snapInterval
 * @param {number} snapHalfInterval
 * @returns {number}
 */
var snapValue = function ( value, snapInterval, snapHalfInterval ) {
  snapHalfInterval = snapHalfInterval || snapInterval * 0.5;

  const direction = value >= 0 ? 1 : -1;
  value = Math.abs(value);

  const snapOverflow = value % snapInterval;
  value -= snapOverflow;
  if ( snapOverflow >= snapHalfInterval ) {
    value += snapInterval;
  }

  return value * direction;
};
