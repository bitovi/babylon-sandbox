/**
 * Created on 10.3.2017.
 */
"use strict";

!function () {
  var _collisionMeshes = [];
  var _colMat;

  window.initCollision = function ( meshes, scene ) {
    _collisionMeshes = meshes;

    for ( let i = 0; i < meshes.length; ++i ) {
      meshes[ i ]._originalMat = meshes[ i ].material;
    }

    _colMat = new BABYLON.StandardMaterial( "colmat", scene );
    _colMat.diffuseColor = new BABYLON.Color3( 1, 0, 0 );
    _colMat.specularColor = BABYLON.Color3.Black();
    _colMat.alpha = 0.7;
  };

  window.checkCollision = function ( mesh ) {

    for ( let i = 0; i < _collisionMeshes.length; ++i ) {
      let collisionMesh = _collisionMeshes[ i ];
      if ( intersectsTriangle( mesh, collisionMesh ) ) {
        collisionMesh.material = _colMat;
      } else {
        if ( collisionMesh.material === _colMat ) {
          collisionMesh.material = collisionMesh._originalMat;
        }
      }
    }
  }
  /**
   *
   * @param {BABYLON.Mesh} a
   * @param {BABYLON.Mesh} b
   */
  window.intersectsTriangle = function ( a, b ) {

    const aMeshes = [ a, ...a.getChildMeshes() ];
    const bMeshes = [ b, ...b.getChildMeshes() ];

    for ( let i = 0; i < aMeshes.length; ++i ) {
      let aMesh = aMeshes[ i ];
      for ( let j = 0; j < bMeshes.length; ++j ) {
        if ( intersectsMeshTriangles( aMesh, bMeshes[ j ] ) ) {
          return true;
        }
      }
    }

    return false;
  }

var _tmpVertices = [];
// The _tmpVertices could have 1000 entries but the _tmpVerticesLength might be only 25,
// Meaning only 25 pointsa are used
var _tmpVerticesLength = 0;
var _tmpMatrix = BABYLON.Matrix.Identity();

/**
 * @typedef {{
 * minX: number,
 * maxX: number,
 * minY: number,
 * maxY: number,
 * minZ: number,
 * maxZ: number
 * }} TriangleBounds
 */

/**
 * @typedef {{
 * A: number,
 * B: number,
 * C: number,
 * X0: number,
 * X1: number
 * }} Interval
 */

/**
 * Check 2 meshes against each other if they collide
 * @param {BABYLON.Mesh} a
 * @param {BABYLON.Mesh} b
 * @return {boolean}
 */
var intersectsMeshTriangles = function ( a, b ) {
  // every 3rd entry makes a complete triangle
  const Av = getVertices( a );
  // Convert b vertice points to localspace for A
  const Bv = getVerticesTransformed( getVertices( b ), b, a.getWorldMatrix() );

  // Cache all the b trianglebounds
  let bTriangleBoundsList = [];

  for ( let i = 0; i < Av.length; i += 3 ) {
    const a0 = Av[ i ];
    const a1 = Av[ i + 1 ];
    const a2 = Av[ i + 2 ];

    const aTriangleBounds = getTriangleBounds( a0, a1, a2 );

    for ( let j = 0; j < Bv.length; j += 3 ) {

      const b0 = Bv[ j ];
      const b1 = Bv[ j + 1 ];
      const b2 = Bv[ j + 2 ];

      let bTriangleBounds;

      if ( bTriangleBoundsList[ j ] ) {
        bTriangleBounds = bTriangleBoundsList[ j ];
      } else {
        bTriangleBounds = getTriangleBounds( b0, b1, b2 );
        bTriangleBoundsList[ j ] = bTriangleBounds;
      }


      if ( checkTriangleBounds( aTriangleBounds, bTriangleBounds ) ) {
        const success = window.triTriIntersect( a0, a1, a2, b0, b1, b2 );
        if ( success ) {
          return true;
        }
      }
    }
  }

}

/**
 * Get the minmax bounds for a triangle
 * @param {BABYLON.Vector3} v0
 * @param {BABYLON.Vector3} v1
 * @param {BABYLON.Vector3} v2
 * @return {TriangleBounds}
 */
function getTriangleBounds( v0, v1, v2 ) {
  let x = v0.x;
  let y = v0.y;
  let z = v0.z;

  let minX = x, maxX = x;
  let minY = y, maxY = y;
  let minZ = z, maxZ = z;

  x = v1.x;
  y = v1.y;
  z = v1.z;

  if ( x < minX ) minX = x;
  if ( x > maxX ) maxX = x;
  if ( y < minY ) minY = y;
  if ( y > maxY ) maxY = y;
  if ( z < minZ ) minZ = z;
  if ( z > maxZ ) maxZ = z;

  x = v2.x;
  y = v2.y;
  z = v2.z;

  if ( x < minX ) minX = x;
  if ( x > maxX ) maxX = x;
  if ( y < minY ) minY = y;
  if ( y > maxY ) maxY = y;
  if ( z < minZ ) minZ = z;
  if ( z > maxZ ) maxZ = z;

  return {
    minX: minX,
    maxX: maxX,
    minY: minY,
    maxY: maxY,
    minZ: minZ,
    maxZ: maxZ
  }
}

/**
 *
 * @param {TriangleBounds} a
 * @param {TriangleBounds} b
 */
function checkTriangleBounds( a, b ) {
  const aMinX = a.minX;
  const aMaxX = a.maxX;
  const aMinY = a.minY;
  const aMaxY = a.maxY;
  const aMinZ = a.minZ;
  const aMaxZ = a.maxZ;

  const bMinX = b.minX;
  const bMaxX = b.maxX;
  const bMinY = b.minY;
  const bMaxY = b.maxY;
  const bMinZ = b.minZ;
  const bMaxZ = b.maxZ;

  if ( ( ( aMinX >= bMinX && aMinX <= bMaxX ) || ( aMaxX <= bMaxX && aMaxX >= bMinX ) )
      && ( aMinY >= bMinY && aMinY <= bMaxY ) || ( aMaxY <= bMaxY && aMaxY >= bMinY )
      && ( aMinZ >= bMinZ && aMinZ <= bMaxZ ) || ( aMaxZ <= bMaxZ && aMaxZ >= bMinZ )
  ) {
    return true;
  }

  return false;
}

/**
 * getVertices
 * @param {BABYLON.Mesh} mesh
 * @return {BABYLON.Vector3[]}
 */
function getVertices ( mesh ) {

  if ( mesh.__vertices ) {
    return mesh.__vertices;
  }

  const vertices = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
  const indices = mesh.getIndices();

  let result = [];
  // Get all triangles
  for ( let i = 0; i < indices.length; ++i ) {
    let index = indices[ i ] * 3;
    let vertex = new BABYLON.Vector3( vertices[ index ], vertices[ index + 1 ], vertices[ index + 2 ] );
    result.push( vertex );
  }

  mesh.__vertices = result;

  return result;
}

function getVerticesTransformed ( vertices, mesh, otherWorldMatrix ) {
  const verticesLength = vertices.length;
  const worldMatrix = mesh.getWorldMatrix();
  let result = _tmpVertices;
  let finalMatrix = _tmpMatrix;

  _tmpVerticesLength = verticesLength;

  let tmpAInverseWorldMatrix = BABYLON.Tmp.Matrix[ 0 ];
  otherWorldMatrix.invertToRef( tmpAInverseWorldMatrix );

  worldMatrix.multiplyToRef( tmpAInverseWorldMatrix, finalMatrix );

  for ( let i = 0; i < verticesLength; ++i ) {
    const vertex = vertices[ i ];
    let resultVertex;
    // For example result [ 0 ] = { x, y, z }
    // i = 1,  i >= result.length ( 1 )
    if ( i >= result.length ) {
      resultVertex = new BABYLON.Vector3( 0, 0, 0 );
      result.push( resultVertex );
    } else {
      resultVertex = result[ i ];
    }

    BABYLON.Vector3.TransformCoordinatesToRef( vertex, finalMatrix, resultVertex );
  }

  return result;
}

}();