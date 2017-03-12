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
        if ( checkMeshes( aMesh, bMeshes[ j ] ) ) {
          return true;
        }
      }
    }

    return false;
  }

  function checkMeshes( a, b ) {
    if ( a.intersectsMesh( b, true ) ) {
      const Av = getTriangles( a );
      const Bv = getTriangles( b );

      for ( let i = 0; i < Av.length; i += 3 ) {
        const a0 = Av[ i ];
        const a1 = Av[ i + 1 ];
        const a2 = Av[ i + 2 ];

        for ( let j = 0; j < Bv.length; j += 3 ) {

          const b0 = Bv[ j ];
          const b1 = Bv[ j + 1 ];
          const b2 = Bv[ j + 2 ];

          const success = window.triTriIntersect( a0, a1, a2, b0, b1, b2 );
          if ( success ) {
            return true;
          }
        }
      }
    }
  }

  /**
   * getTriangles
   * @param {BABYLON.Mesh} mesh
   * @return {BABYLON.Vector3[]}
   */
  function getTriangles ( mesh ) {

    const vertices = mesh.getVerticesData( BABYLON.VertexBuffer.PositionKind );
    const indices = mesh.getIndices();
    const worldMatrix = mesh.getWorldMatrix();

    let result = [];
    // Get all triangles
    for ( let i = 0; i < indices.length; ++i ) {
      let index = indices[ i ] * 3;
      let vertex = new BABYLON.Vector3( vertices[ index ], vertices[ index + 1 ], vertices[ index + 2 ] );
      BABYLON.Vector3.TransformCoordinatesToRef( vertex, worldMatrix, vertex );

      result.push( vertex );
    }

    return result;
  }
}();

//   // Source: http://gamedev.stackexchange.com/questions/88060/triangle-triangle-intersection-code
//   function triangleIntersects ( p0, p1, p2, q0, q1, q2 ) {
//     return tri_tri_overlap_test_3d( p0, p1, p2, q0, q1, q2 );
//   }
//
//   function tri_tri_overlap_test_3d( p1, q1, r1, p2, q2, r2) {
//     // dot products
//     let dp1, dq1, dr1, dp2, dq2, dr2;
//     // Vectors
//     let v1 = [];
//     let v2 = [];
//     let N1 = [];
//     let N2 = [];
//
//     /* Compute distance signs  of p1, q1 and r1 to the plane of
//      triangle(p2,q2,r2) */
//     SUB(v1,p2,r2);
//     SUB(v2,q2,r2);
//     CROSS(N2,v1,v2);
//
//     SUB(v1,p1,r2);
//     dp1 = DOT(v1,N2);
//     SUB(v1,q1,r2);
//     dq1 = DOT(v1,N2);
//     SUB(v1,r1,r2);
//     dr1 = DOT(v1,N2);
//
//     if ( ( (dp1 * dq1) > 0.0) && ((dp1 * dr1) > 0.0)) {
//       return 0;
//     }
//
//     /* Compute distance signs  of p2, q2 and r2 to the plane of
//      triangle(p1,q1,r1) */
//
//     SUB(v1,q1,p1);
//     SUB(v2,r1,p1);
//     CROSS(N1,v1,v2);
//
//     SUB(v1,p2,r1);
//     dp2 = DOT(v1,N1);
//     SUB(v1,q2,r1);
//     dq2 = DOT(v1,N1);
//     SUB(v1,r2,r1);
//     dr2 = DOT(v1,N1);
//
//     if ( ((dp2 * dq2) > 0.0) && ((dp2 * dr2) > 0.0) ) {
//       return 0;
//     }
//
//     if (dp1 > 0.0) {
//       if (dq1 > 0.0) {
//         return TRI_TRI_3D(r1,p1,q1,p2,r2,q2,dp2,dr2,dq2);
//       }
//       else if (dr1 > 0.0) {
//         return TRI_TRI_3D(q1,r1,p1,p2,r2,q2,dp2,dr2,dq2);
//       }
//       else {
//         return TRI_TRI_3D(p1,q1,r1,p2,q2,r2,dp2,dq2,dr2);
//       }
//     }
//     else if (dp1 < 0.0) {
//       if (dq1 < 0.0) {
//         return TRI_TRI_3D(r1,p1,q1,p2,q2,r2,dp2,dq2,dr2);
//       }
//       else if (dr1 < 0.0) {
//         return TRI_TRI_3D(q1,r1,p1,p2,q2,r2,dp2,dq2,dr2);
//       }
//       else {
//         return TRI_TRI_3D(p1,q1,r1,p2,r2,q2,dp2,dr2,dq2);
//       }
//     }
//     else {
//       if (dq1 < 0.0) {
//         if (dr1 >= 0.0) {
//           return TRI_TRI_3D(q1,r1,p1,p2,r2,q2,dp2,dr2,dq2);
//         }
//         else {
//           return TRI_TRI_3D(p1,q1,r1,p2,q2,r2,dp2,dq2,dr2);
//         }
//       }
//       else if (dq1 > 0.0) {
//         if (dr1 > 0.0) {
//           return TRI_TRI_3D(p1,q1,r1,p2,r2,q2,dp2,dr2,dq2);
//         }
//         else {
//           return TRI_TRI_3D(q1,r1,p1,p2,q2,r2,dp2,dq2,dr2);
//         }
//       }
//       else  {
//         if (dr1 > 0.0) {
//           return TRI_TRI_3D(r1,p1,q1,p2,q2,r2,dp2,dq2,dr2);
//         }
//         else if (dr1 < 0.0) {
//           return TRI_TRI_3D(r1,p1,q1,p2,r2,q2,dp2,dr2,dq2);
//         }
//         else {
//           return coplanar_tri_tri3d(p1,q1,r1,p2,q2,r2,N1,N2);
//         }
//       }
//     }
//   }
//
//   function coplanar_tri_tri3d ( p1, q1, r1, p2, q2, r2, normal_1, normal_2 ) {
//
//     let P1 = [], Q1 = [], R1 = [];
//     let P2 = [], Q2 = [], R2 = [];
//
//     let n_x, n_y, n_z;
//
//     n_x = ((normal_1[0] < 0) ? -normal_1[0] : normal_1[0]);
//     n_y = ((normal_1[1] <0) ? -normal_1[1] : normal_1[1]);
//     n_z = ((normal_1[2]<0) ? -normal_1[2] : normal_1[2]);
//
//
//     /* Projection of the triangles in 3D onto 2D such that the area of
//      the projection is maximized. */
//
//
//     if (( n_x > n_z ) && ( n_x >= n_y )) {
//         // Project onto plane YZ
//
//         P1[0] = q1[2]; P1[1] = q1[1];
//         Q1[0] = p1[2]; Q1[1] = p1[1];
//         R1[0] = r1[2]; R1[1] = r1[1];
//
//         P2[0] = q2[2]; P2[1] = q2[1];
//         Q2[0] = p2[2]; Q2[1] = p2[1];
//         R2[0] = r2[2]; R2[1] = r2[1];
//
//     } else if (( n_y > n_z ) && ( n_y >= n_x )) {
//         // Project onto plane XZ
//         P1[0] = q1[0]; P1[1] = q1[2];
//         Q1[0] = p1[0]; Q1[1] = p1[2];
//         R1[0] = r1[0]; R1[1] = r1[2];
//
//         P2[0] = q2[0]; P2[1] = q2[2];
//         Q2[0] = p2[0]; Q2[1] = p2[2];
//         R2[0] = r2[0]; R2[1] = r2[2];
//
//     } else {
//         // Project onto plane XY
//         P1[0] = p1[0]; P1[1] = p1[1];
//         Q1[0] = q1[0]; Q1[1] = q1[1];
//         R1[0] = r1[0]; R1[1] = r1[1];
//
//         P2[0] = p2[0]; P2[1] = p2[1];
//         Q2[0] = q2[0]; Q2[1] = q2[1];
//         R2[0] = r2[0]; R2[1] = r2[1];
//     }
//
//     return tri_tri_overlap_test_2d(P1, Q1, R1, P2, Q2, R2);
//   }
//
//
//   function tri_tri_overlap_test_2d ( p1, q1, r1, p2, q2, r2 ) {
//     throw "not implemented";
//   }
//
//   function tri_tri_intersection_test_3d ( p1, q1, r1, p2, q2, r2, int* coplanar, source, target )
//   {
//     throw "not implemented";
//   }
//
//   function ZERO_TEST ( x ) {
//     return x == 0;
//   }
//
//   function CROSS ( dest, v1, v2 ) {
//     dest[ 0 ] = v1[ 1 ] * v2[ 2 ] - v1[ 2 ] * v2[ 1 ];
//     dest[ 1 ] = v1[ 2 ] * v2[ 0 ] - v1[ 0 ] * v2[ 2 ];
//     dest[ 2 ] = v1[ 0 ] * v2[ 1 ] - v1[ 1 ] * v2[ 0 ];
//   }
//
//   function DOT(v1,v2) {
//     return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
//   }
//
//   function SUB( dest, v1, v2 ) {
//     dest[ 0 ] = v1[ 0 ] - v2[ 0 ];
//     dest[ 1 ] = v1[ 1 ] - v2[ 1 ];
//     dest[ 2 ] = v1[ 2 ] - v2[ 2 ];
//   }
//
//   function SCALAR( dest, alpha, v ) {
//     dest[ 0 ] = alpha * v[ 0 ];
//     dest[ 1 ] = alpha * v[ 1 ];
//     dest[ 2 ] = alpha * v[ 2 ];
//   }
//
//   function CHECK_MIN_MAX( p1, q1, r1, p2, q2, r2 ) {
//     SUB(v1,p2,q1)
//     SUB(v2,p1,q1)
//     CROSS(N1,v1,v2)
//     SUB(v1,q2,q1)
//     if (DOT(v1,N1) > 0.0) {
//       return 0;
//     }
//
//     SUB(v1,p2,p1)
//     SUB(v2,r1,p1)
//     CROSS(N1,v1,v2)
//     SUB(v1,r2,p1)
//     if ( DOT(v1,N1) > 0.0) {
//       return 0;
//     }
//     else {
//       return 1;
//     }
//   }
//
//   function TRI_TRI_3D(p1,q1,r1,p2,q2,r2,dp2,dq2,dr2) {
//     if (dp2 > 0.0) {
//       if (dq2 > 0.0) CHECK_MIN_MAX(p1,r1,q1,r2,p2,q2)
//       else if (dr2 > 0.0) CHECK_MIN_MAX(p1,r1,q1,q2,r2,p2)
//       else CHECK_MIN_MAX(p1,q1,r1,p2,q2,r2) }
//     else if (dp2 < 0.0) {
//       if (dq2 < 0.0) CHECK_MIN_MAX(p1,q1,r1,r2,p2,q2)
//       else if (dr2 < 0.0) CHECK_MIN_MAX(p1,q1,r1,q2,r2,p2)
//       else CHECK_MIN_MAX(p1,r1,q1,p2,q2,r2)
//     }
//     else {
//       if (dq2 < 0.0) {
//         if (dr2 >= 0.0)  CHECK_MIN_MAX(p1,r1,q1,q2,r2,p2)
//         else CHECK_MIN_MAX(p1,q1,r1,p2,q2,r2)
//       }
//       else if (dq2 > 0.0) {
//         if (dr2 > 0.0) CHECK_MIN_MAX(p1,r1,q1,p2,q2,r2)
//         else CHECK_MIN_MAX(p1,q1,r1,q2,r2,p2)
//       }
//       else  {
//         if (dr2 > 0.0) CHECK_MIN_MAX(p1,q1,r1,r2,p2,q2)
//         else if (dr2 < 0.0) CHECK_MIN_MAX(p1,r1,q1,r2,p2,q2)
//         else return coplanar_tri_tri3d(p1,q1,r1,p2,q2,r2,N1,N2);
//       }
//     }
//   }
//
//   function CONSTRUCT_INTERSECTION( p1, q1, r1, p2, q2, r2 ) {
//     SUB(v1,q1,p1)
//     SUB(v2,r2,p1)
//     CROSS(N,v1,v2)
//     SUB(v,p2,p1)
//     if (DOT(v,N) > 0.0)
//     {
//     SUB(v1,r1,p1)
//     CROSS(N,v1,v2)
//     if (DOT(v,N) <= 0.0) {
//     SUB(v2,q2,p1)
//     CROSS(N,v1,v2)
//     if (DOT(v,N) > 0.0) {
//     SUB(v1,p1,p2)
//     SUB(v2,p1,r1)
//     alpha = DOT(v1,N2) / DOT(v2,N2);
//     SCALAR(v1,alpha,v2)
//     SUB(source,p1,v1)
//     SUB(v1,p2,p1)
//     SUB(v2,p2,r2)
//     alpha = DOT(v1,N1) / DOT(v2,N1);
//     SCALAR(v1,alpha,v2)
//     SUB(target,p2,v1)
//     return 1;
//     } else {
//     SUB(v1,p2,p1)
//     SUB(v2,p2,q2)
//     alpha = DOT(v1,N1) / DOT(v2,N1);
//     SCALAR(v1,alpha,v2)
//     SUB(source,p2,v1)
//     SUB(v1,p2,p1)
//     SUB(v2,p2,r2)
//     alpha = DOT(v1,N1) / DOT(v2,N1);
//     SCALAR(v1,alpha,v2)
//     SUB(target,p2,v1)
//     return 1;
//     }
//     } else {
//     return 0;
//     }
//     } else {
//     SUB(v2,q2,p1)
//     CROSS(N,v1,v2)
//     if (DOT(v,N) < 0.0) {
//     return 0;
//     } else {
//     SUB(v1,r1,p1)
//     CROSS(N,v1,v2)
//     if (DOT(v,N) >= 0.0) {
//     SUB(v1,p1,p2)
//     SUB(v2,p1,r1)
//     alpha = DOT(v1,N2) / DOT(v2,N2);
//     SCALAR(v1,alpha,v2)
//     SUB(source,p1,v1)
//     SUB(v1,p1,p2)
//     SUB(v2,p1,q1)
//     alpha = DOT(v1,N2) / DOT(v2,N2);
//     SCALAR(v1,alpha,v2)
//     SUB(target,p1,v1)
//     return 1;
//     } else {
//     SUB(v1,p2,p1)
//     SUB(v2,p2,q2)
//     alpha = DOT(v1,N1) / DOT(v2,N1);
//     SCALAR(v1,alpha,v2)
//     SUB(source,p2,v1)
//     SUB(v1,p1,p2)
//     SUB(v2,p1,q1)
//     alpha = DOT(v1,N2) / DOT(v2,N2);
//     SCALAR(v1,alpha,v2)
//     SUB(target,p1,v1)
//     return 1;
//     }}}
//   }
//
//
//
//   function TRI_TRI_INTER_3D(p1,q1,r1,p2,q2,r2,dp2,dq2,dr2) {
//     if (dp2 > 0.0) {
//       if (dq2 > 0.0) CONSTRUCT_INTERSECTION(p1,r1,q1,r2,p2,q2)
//       else if (dr2 > 0.0) CONSTRUCT_INTERSECTION(p1,r1,q1,q2,r2,p2)
//       else CONSTRUCT_INTERSECTION(p1,q1,r1,p2,q2,r2)
//     }
//     else if (dp2 < 0.0) {
//     if (dq2 < 0.0) CONSTRUCT_INTERSECTION(p1,q1,r1,r2,p2,q2)
//     else if (dr2 < 0.0) CONSTRUCT_INTERSECTION(p1,q1,r1,q2,r2,p2)
//     else CONSTRUCT_INTERSECTION(p1,r1,q1,p2,q2,r2)
//     }
//     else {
//       if (dq2 < 0.0) {
//       if (dr2 >= 0.0)  CONSTRUCT_INTERSECTION(p1,r1,q1,q2,r2,p2)
//       else CONSTRUCT_INTERSECTION(p1,q1,r1,p2,q2,r2)
//       }
//       else if (dq2 > 0.0) {
//       if (dr2 > 0.0) CONSTRUCT_INTERSECTION(p1,r1,q1,p2,q2,r2)
//       else  CONSTRUCT_INTERSECTION(p1,q1,r1,q2,r2,p2)
//       }
//       else  {
//       if (dr2 > 0.0) CONSTRUCT_INTERSECTION(p1,q1,r1,r2,p2,q2)
//       else if (dr2 < 0.0) CONSTRUCT_INTERSECTION(p1,r1,q1,r2,p2,q2)
//       else {
//       //*coplanar = 1;
//       return coplanar_tri_tri3d(p1,q1,r1,p2,q2,r2,N1,N2);
//       }
//       }
//     }
//   }
//
// }();
//
// /*
//  *
//  *  Three-dimensional Triangle-Triangle Intersection
//  *
//  */
//
// /*
//  This macro is called when the triangles surely intersect
//  It constructs the segment of intersection of the two triangles
//  if they are not coplanar.
//  */
//
// #define
//
//
// /*
//  The following version computes the segment of intersection of the
//  two triangles if it exists.
//  coplanar returns whether the triangles are coplanar
//  source and target are the endpoints of the line segment of intersection
//  */
//
// int tri_tri_intersection_test_3d(real p1[3], real q1[3], real r1[3],
//                                  real p2[3], real q2[3], real r2[3],
//                                  int * coplanar,
//                                  real source[3], real target[3] )
//
// {
//     real dp1, dq1, dr1, dp2, dq2, dr2;
//     real v1[3], v2[3], v[3];
//     real N1[3], N2[3], N[3];
//     real alpha;
//
//     // Compute distance signs  of p1, q1 and r1
//     // to the plane of triangle(p2,q2,r2)
//
//
//     SUB(v1,p2,r2)
//     SUB(v2,q2,r2)
//     CROSS(N2,v1,v2)
//
//     SUB(v1,p1,r2)
//     dp1 = DOT(v1,N2);
//     SUB(v1,q1,r2)
//     dq1 = DOT(v1,N2);
//     SUB(v1,r1,r2)
//     dr1 = DOT(v1,N2);
//
//     if (((dp1 * dq1) > 0.0) && ((dp1 * dr1) > 0.0))  return 0;
//
//     // Compute distance signs  of p2, q2 and r2
//     // to the plane of triangle(p1,q1,r1)
//
//
//     SUB(v1,q1,p1)
//     SUB(v2,r1,p1)
//     CROSS(N1,v1,v2)
//
//     SUB(v1,p2,r1)
//     dp2 = DOT(v1,N1);
//     SUB(v1,q2,r1)
//     dq2 = DOT(v1,N1);
//     SUB(v1,r2,r1)
//     dr2 = DOT(v1,N1);
//
//     if (((dp2 * dq2) > 0.0) && ((dp2 * dr2) > 0.0)) return 0;
//
//     // Permutation in a canonical form of T1's vertices
//
//
//     //  printf("d1 = [%f %f %f], d2 = [%f %f %f]\n", dp1, dq1, dr1, dp2, dq2, dr2);
//     /*
//      // added by Aaron
//      if (ZERO_TEST(dp1) || ZERO_TEST(dq1) ||ZERO_TEST(dr1) ||ZERO_TEST(dp2) ||ZERO_TEST(dq2) ||ZERO_TEST(dr2))
//      {
//      coplanar = 1;
//      return 0;
//      }
//      */
//
//
//     if (dp1 > 0.0) {
//         if (dq1 > 0.0) TRI_TRI_INTER_3D(r1,p1,q1,p2,r2,q2,dp2,dr2,dq2)
//             else if (dr1 > 0.0) TRI_TRI_INTER_3D(q1,r1,p1,p2,r2,q2,dp2,dr2,dq2)
//
//                 else TRI_TRI_INTER_3D(p1,q1,r1,p2,q2,r2,dp2,dq2,dr2)
//                     } else if (dp1 < 0.0) {
//                         if (dq1 < 0.0) TRI_TRI_INTER_3D(r1,p1,q1,p2,q2,r2,dp2,dq2,dr2)
//                             else if (dr1 < 0.0) TRI_TRI_INTER_3D(q1,r1,p1,p2,q2,r2,dp2,dq2,dr2)
//                                 else TRI_TRI_INTER_3D(p1,q1,r1,p2,r2,q2,dp2,dr2,dq2)
//                                     } else {
//                                         if (dq1 < 0.0) {
//                                             if (dr1 >= 0.0) TRI_TRI_INTER_3D(q1,r1,p1,p2,r2,q2,dp2,dr2,dq2)
//                                                 else TRI_TRI_INTER_3D(p1,q1,r1,p2,q2,r2,dp2,dq2,dr2)
//                                                     }
//                                         else if (dq1 > 0.0) {
//                                             if (dr1 > 0.0) TRI_TRI_INTER_3D(p1,q1,r1,p2,r2,q2,dp2,dr2,dq2)
//                                                 else TRI_TRI_INTER_3D(q1,r1,p1,p2,q2,r2,dp2,dq2,dr2)
//                                                     }
//                                         else  {
//                                             if (dr1 > 0.0) TRI_TRI_INTER_3D(r1,p1,q1,p2,q2,r2,dp2,dq2,dr2)
//                                                 else if (dr1 < 0.0) TRI_TRI_INTER_3D(r1,p1,q1,p2,r2,q2,dp2,dr2,dq2)
//                                                     else {
//                                                         // triangles are co-planar
//
//                                                         *coplanar = 1;
//                                                         return coplanar_tri_tri3d(p1,q1,r1,p2,q2,r2,N1,N2);
//                                                     }
//                                         }
//                                     }
// };
//
//
//
//
//
// /*
//  *
//  *  Two dimensional Triangle-Triangle Overlap Test
//  *
//  */
//
//
// /* some 2D macros */
//
// #define ORIENT_2D(a, b, c)  ((a[0]-c[0])*(b[1]-c[1])-(a[1]-c[1])*(b[0]-c[0]))
//
//
// #define INTERSECTION_TEST_VERTEXA(P1, Q1, R1, P2, Q2, R2) {\
// if (ORIENT_2D(R2,P2,Q1) >= 0.0)\
// if (ORIENT_2D(R2,Q2,Q1) <= 0.0)\
// if (ORIENT_2D(P1,P2,Q1) > 0.0) {\
// if (ORIENT_2D(P1,Q2,Q1) <= 0.0) return 1; \
// else return 0;} else {\
// if (ORIENT_2D(P1,P2,R1) >= 0.0)\
// if (ORIENT_2D(Q1,R1,P2) >= 0.0) return 1; \
// else return 0;\
// else return 0;}\
// else \
// if (ORIENT_2D(P1,Q2,Q1) <= 0.0)\
// if (ORIENT_2D(R2,Q2,R1) <= 0.0)\
// if (ORIENT_2D(Q1,R1,Q2) >= 0.0) return 1; \
// else return 0;\
// else return 0;\
// else return 0;\
// else\
// if (ORIENT_2D(R2,P2,R1) >= 0.0) \
// if (ORIENT_2D(Q1,R1,R2) >= 0.0)\
// if (ORIENT_2D(P1,P2,R1) >= 0.0) return 1;\
// else return 0;\
// else \
// if (ORIENT_2D(Q1,R1,Q2) >= 0.0) {\
// if (ORIENT_2D(R2,R1,Q2) >= 0.0) return 1; \
// else return 0; }\
// else return 0; \
// else  return 0; \
// };
//
// #define INTERSECTION_TEST_VERTEX(P1, Q1, R1, P2, Q2, R2) {\
//   if (ORIENT_2D(R2,P2,Q1) >= 0.0)\
//     if (ORIENT_2D(R2,Q2,Q1) <= 0.0)\
//       if (ORIENT_2D(P1,P2,Q1) > 0.0) {\
//         if (ORIENT_2D(P1,Q2,Q1) <= 0.0) return 1; \
//         else return 0;} else {\
//         if (ORIENT_2D(P1,P2,R1) >= 0.0)\
//           if (ORIENT_2D(Q1,R1,P2) >= 0.0) return 1; \
//           else return 0;\
//         else return 0;}\
//     else \
//       if (ORIENT_2D(P1,Q2,Q1) <= 0.0)\
//         if (ORIENT_2D(R2,Q2,R1) <= 0.0)\
//           if (ORIENT_2D(Q1,R1,Q2) >= 0.0) return 1; \
//           else return 0;\
//         else return 0;\
//       else return 0;\
//   else\
//     if (ORIENT_2D(R2,P2,R1) >= 0.0) \
//       if (ORIENT_2D(Q1,R1,R2) >= 0.0)\
//         if (ORIENT_2D(P1,P2,R1) >= 0.0) return 1;\
//         else return 0;\
//       else \
//         if (ORIENT_2D(Q1,R1,Q2) >= 0.0) {\
//           if (ORIENT_2D(R2,R1,Q2) >= 0.0) return 1; \
//           else return 0; }\
//         else return 0; \
//     else  return 0; \
//  };
//
//
// #define INTERSECTION_TEST_EDGE(P1, Q1, R1, P2, Q2, R2) { \
// if (ORIENT_2D(R2,P2,Q1) >= 0.0) {\
// if (ORIENT_2D(P1,P2,Q1) >= 0.0) { \
// if (ORIENT_2D(P1,Q1,R2) >= 0.0) return 1; \
// else return 0;} else { \
// if (ORIENT_2D(Q1,R1,P2) >= 0.0){ \
// if (ORIENT_2D(R1,P1,P2) >= 0.0) return 1; else return 0;} \
// else return 0; } \
// } else {\
// if (ORIENT_2D(R2,P2,R1) >= 0.0) {\
// if (ORIENT_2D(P1,P2,R1) >= 0.0) {\
// if (ORIENT_2D(P1,R1,R2) >= 0.0) return 1;  \
// else {\
// if (ORIENT_2D(Q1,R1,R2) >= 0.0) return 1; else return 0;}}\
// else  return 0; }\
// else return 0; }}
//
//
//
// int ccw_tri_tri_intersection_2d(real p1[2], real q1[2], real r1[2],
//                                 real p2[2], real q2[2], real r2[2]) {
//     if ( ORIENT_2D(p2,q2,p1) >= 0.0 ) {
//         if ( ORIENT_2D(q2,r2,p1) >= 0.0 ) {
//             if ( ORIENT_2D(r2,p2,p1) >= 0.0 ) return 1;
//             else INTERSECTION_TEST_EDGE(p1,q1,r1,p2,q2,r2)
//                 } else {
//                     if ( ORIENT_2D(r2,p2,p1) >= 0.0 )
//                         INTERSECTION_TEST_EDGE(p1,q1,r1,r2,p2,q2)
//                         else INTERSECTION_TEST_VERTEX(p1,q1,r1,p2,q2,r2)}}
//     else {
//         if ( ORIENT_2D(q2,r2,p1) >= 0.0 ) {
//             if ( ORIENT_2D(r2,p2,p1) >= 0.0 )
//                 INTERSECTION_TEST_EDGE(p1,q1,r1,q2,r2,p2)
//                 else  INTERSECTION_TEST_VERTEX(p1,q1,r1,q2,r2,p2)}
//         else INTERSECTION_TEST_VERTEX(p1,q1,r1,r2,p2,q2)}
// };
//
//
// int tri_tri_overlap_test_2d(real p1[2], real q1[2], real r1[2],
//                             real p2[2], real q2[2], real r2[2]) {
//     if ( ORIENT_2D(p1,q1,r1) < 0.0 )
//         if ( ORIENT_2D(p2,q2,r2) < 0.0 )
//             return ccw_tri_tri_intersection_2d(p1,r1,q1,p2,r2,q2);
//         else
//             return ccw_tri_tri_intersection_2d(p1,r1,q1,p2,q2,r2);
//         else
//             if ( ORIENT_2D(p2,q2,r2) < 0.0 )
//                 return ccw_tri_tri_intersection_2d(p1,q1,r1,p2,r2,q2);
//             else
//                 return ccw_tri_tri_intersection_2d(p1,q1,r1,p2,q2,r2);
//
// };

