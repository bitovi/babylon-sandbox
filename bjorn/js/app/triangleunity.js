/**
 * Created on 11.3.2017.
 */
"use strict";
// Tomas Möller implementation
// Source: http://answers.unity3d.com/questions/861719/a-fast-triangle-triangle-intersection-algorithm-fo.html



function Sort(v)
{
   if (v.x > v.y)
   {
       let c = v.x;
       v.x = v.y;
       v.y = c;
   }
}

      // return bool
     /// <summary>
     /// This edge to edge test is based on Franlin Antonio's gem: "Faster Line Segment Intersection", in Graphics Gems III, pp. 199-202
     /// </summary>
     function EdgeEdgeTest(v0, v1, u0, u1, i0, i1)
     {
       // floats
         let Ax, Ay, Bx, By, Cx, Cy, e, d, f;
         Ax = v1[i0] - v0[i0];
         Ay = v1[i1] - v0[i1];

         Bx = u0[i0] - u1[i0];
         By = u0[i1] - u1[i1];
         Cx = v0[i0] - u0[i0];
         Cy = v0[i1] - u0[i1];
         f = Ay * Bx - Ax * By;
         d = By * Cx - Bx * Cy;
         if ((f > 0 && d >= 0 && d <= f) || (f < 0 && d <= 0 && d >= f))
         {
             e = Ax * Cy - Ay * Cx;
             if (f > 0)
             {
                 if (e >= 0 && e <= f) { return true; }
             }
             else
             {
                 if (e <= 0 && e >= f) { return true; }
             }
         }

         return false;
     }

     // return bool
     function EdgeAgainstTriEdges(v0, v1, u0, u1, u2, i0, i1)
     {
         // test edge u0,u1 against v0,v1
         if (EdgeEdgeTest(v0, v1, u0, u1, i0, i1)) { return true; }

         // test edge u1,u2 against v0,v1
         if (EdgeEdgeTest(v0, v1, u1, u2, i0, i1)) { return true; }

         // test edge u2,u1 against v0,v1
         if (EdgeEdgeTest(v0, v1, u2, u0, i0, i1)) { return true; }

         return false;
     }

     // returns bool
     function PointInTri(v0, u0, u1, u2, i0, i1)
     {
       // Floats
         let a, b, c, d0, d1, d2;

         // is T1 completly inside T2?
         // check if v0 is inside tri(u0,u1,u2)
         a = u1[i1] - u0[i1];
         b = -(u1[i0] - u0[i0]);
         c = -a * u0[i0] - b * u0[i1];
         d0 = a * v0[i0] + b * v0[i1] + c;

         a = u2[i1] - u1[i1];
         b = -(u2[i0] - u1[i0]);
         c = -a * u1[i0] - b * u1[i1];
         d1 = a * v0[i0] + b * v0[i1] + c;

         a = u0[i1] - u2[i1];
         b = -(u0[i0] - u2[i0]);
         c = -a * u2[i0] - b * u2[i1];
         d2 = a * v0[i0] + b * v0[i1] + c;

         if (d0 * d1 > 0.0)
         {
             if (d0 * d2 > 0.0) { return true; }
         }

         return false;
     }

     // returns bool
     function TriTriCoplanar(N, v0, v1, v2, u0, u1, u2)
     {
         let A = [];
         // ints
         let i0, i1;

         // first project onto an axis-aligned plane, that maximizes the area
         // of the triangles, compute indices: i0,i1.
         A[0] = Math.abs( N[0] );
         A[1] = Math.abs( N[1] );
         A[2] = Math.abs( N[2] );
         if (A[0] > A[1])
         {
             if (A[0] > A[2])
             {
                 // A[0] is greatest
                 i0 = 1;
                 i1 = 2;
             }
             else
             {
                 // A[2] is greatest
                 i0 = 0;
                 i1 = 1;
             }
         }
         else
         {
             if (A[2] > A[1])
             {
                 // A[2] is greatest
                 i0 = 0;
                 i1 = 1;
             }
             else
             {
                 // A[1] is greatest
                 i0 = 0;
                 i1 = 2;
             }
         }

         // test all edges of triangle 1 against the edges of triangle 2
         if (EdgeAgainstTriEdges(v0, v1, u0, u1, u2, i0, i1)) { return true; }
         if (EdgeAgainstTriEdges(v1, v2, u0, u1, u2, i0, i1)) { return true; }
         if (EdgeAgainstTriEdges(v2, v0, u0, u1, u2, i0, i1)) { return true; }

         // finally, test if tri1 is totally contained in tri2 or vice versa
         if (PointInTri(v0, u0, u1, u2, i0, i1)) { return true; }
         if (PointInTri(u0, v0, v1, v2, i0, i1)) { return true; }

         return false;
     }


      // returns bool
     function ComputeIntervals( VV0,  VV1,  VV2,
                                D0,  D1,  D2,  D0D1,  D0D2,
                                interval )
     {
         if (D0D1 > 0.0)
         {
             // here we know that D0D2<=0.0
             // that is D0, D1 are on the same side, D2 on the other or on the plane
             interval.A = VV2;
             interval.B = (VV0 - VV2) * D2;
             interval.C = (VV1 - VV2) * D2;
             interval.X0 = D2 - D0;
             interval.X1 = D2 - D1;
         }
         else if (D0D2 > 0.0)
         {
             // here we know that d0d1<=0.0
             interval.A = VV1;
             interval.B = (VV0 - VV1) * D1;
             interval.C = (VV2 - VV1) * D1;
             interval.X0 = D1 - D0;
             interval.X1 = D1 - D2;
         }
         else if (D1 * D2 > 0.0 || D0 != 0.0)
         {
             // here we know that d0d1<=0.0 or that D0!=0.0
             interval.A = VV0;
             interval.B = (VV1 - VV0) * D0;
             interval.C = (VV2 - VV0) * D0;
             interval.X0 = D0 - D1;
             interval.X1 = D0 - D2;
         }
         else if (D1 != 0.0)
         {
             interval.A = VV1;
             interval.B = (VV0 - VV1) * D1;
             interval.C = (VV2 - VV1) * D1;
             interval.X0 = D1 - D0;
             interval.X1 = D1 - D2;
         }
         else if (D2 != 0.0)
         {
             interval.A = VV2;
             interval.B = (VV0 - VV2) * D2;
             interval.C = (VV1 - VV2) * D2;
             interval.X0 = D2 - D0;
             interval.X1 = D2 - D1;
         }
         else
         {
             return true;
         }

         return false;
     }

    // returns bool
     /// <summary>
     /// Checks if the triangle V(v0, v1, v2) intersects the triangle U(u0, u1, u2).
     /// </summary>
     /// <param name="v0">Vertex 0 of V</param>
     /// <param name="v1">Vertex 1 of V</param>
     /// <param name="v2">Vertex 2 of V</param>
     /// <param name="u0">Vertex 0 of U</param>
     /// <param name="u1">Vertex 1 of U</param>
     /// <param name="u2">Vertex 2 of U</param>
     /// <returns>Returns <c>true</c> if V intersects U, otherwise <c>false</c></returns>

/**
 *
 */
     function TriTriIntersect(v0, v1, v2, u0, u1, u2)
     {
         let e1, e2;
         let n1, n2;
         let dd;
         let isect1 = BABYLON.Vector2.Zero();
         let isect2 = BABYLON.Vector2.Zero();

         // Floats
         let du0, du1, du2, dv0, dv1, dv2, d1, d2;
         let du0du1, du0du2, dv0dv1, dv0dv2;
         let vp0, vp1, vp2;
         let up0, up1, up2;
         let bb, cc, max;
          // short
         let index;

         // compute plane equation of triangle(v0,v1,v2)
         e1 = v1 - v0;
         e2 = v2 - v0;
         n1 = BABYLON.Vector3.Cross(e1, e2);
         d1 = -BABYLON.Vector3.Dot(n1, v0);
         // plane equation 1: N1.X+d1=0 */

         // put u0,u1,u2 into plane equation 1 to compute signed distances to the plane
         du0 = BABYLON.Vector3.Dot(n1, u0) + d1;
         du1 = BABYLON.Vector3.Dot(n1, u1) + d1;
         du2 = BABYLON.Vector3.Dot(n1, u2) + d1;

         // coplanarity robustness check
         if (Math.abs(du0) < BABYLON.Epsilon) { du0 = 0.0; }
         if (Math.abs(du1) < BABYLON.Epsilon) { du1 = 0.0; }
         if (Math.abs(du2) < BABYLON.Epsilon) { du2 = 0.0; }

         du0du1 = du0 * du1;
         du0du2 = du0 * du2;

         // same sign on all of them + not equal 0 ?
         if (du0du1 > 0.0 && du0du2 > 0.0)
         {
             // no intersection occurs
             return false;
         }

         // compute plane of triangle (u0,u1,u2)
         e1 = u1 - u0;
         e2 = u2 - u0;
         n2 = BABYLON.Vector3.Cross(e1, e2);
         d2 = -BABYLON.Vector3.Dot(n2, u0);

         // plane equation 2: N2.X+d2=0
         // put v0,v1,v2 into plane equation 2
         dv0 = BABYLON.Vector3.Dot(n2, v0) + d2;
         dv1 = BABYLON.Vector3.Dot(n2, v1) + d2;
         dv2 = BABYLON.Vector3.Dot(n2, v2) + d2;

         if (Math.abs(dv0) < BABYLON.Epsilon) { dv0 = 0.0; }
         if (Math.abs(dv1) < BABYLON.Epsilon) { dv1 = 0.0; }
         if (Math.abs(dv2) < BABYLON.Epsilon) { dv2 = 0.0; }


         dv0dv1 = dv0 * dv1;
         dv0dv2 = dv0 * dv2;

         // same sign on all of them + not equal 0 ?
         if (dv0dv1 > 0.0 && dv0dv2 > 0.0)
         {
             // no intersection occurs
             return false;
         }

         // compute direction of intersection line
         dd = BABYLON.Vector3.Cross(n1, n2);

         // compute and index to the largest component of D
         max = Math.abs(dd[0]);
         index = 0;
         bb = Math.abs(dd[1]);
         cc = Math.abs(dd[2]);
         if (bb > max) { max = bb; index = 1; }
         // max is never used after this point
         if (cc > max) { max = cc; index = 2; }

         // this is the simplified projection onto L
         vp0 = v0[index];
         vp1 = v1[index];
         vp2 = v2[index];

         up0 = u0[index];
         up1 = u1[index];
         up2 = u2[index];
         // compute interval for triangle 1
         let interval1 = {
           A: 0,
           B: 0,
           C: 0,
           X0: 0,
           X1: 0
         };
         if (ComputeIntervals(vp0, vp1, vp2, dv0, dv1, dv2, dv0dv1, dv0dv2, interval1))
         {
             return TriTriCoplanar(n1, v0, v1, v2, u0, u1, u2);
         }

         // compute interval for triangle 2
         let interval2 = {
           A: 0,
           B: 0,
           C: 0,
           X0: 0,
           X1: 0
         };
         if (ComputeIntervals(up0, up1, up2, du0, du1, du2, du0du1, du0du2, interval2))
         {
             return TriTriCoplanar(n1, v0, v1, v2, u0, u1, u2);
         }
          // For triangle 1
         let a = interval1.A;
         let b = interval1.B;
         let c = interval1.C;
         let x0 = interval1.X0;
         let x1 = interval1.X1;
         // For triangle 2
         let d = interval1.A;
         let e = interval1.B;
         let f = interval1.C;
         let y0 = interval1.X0;
         let y1 =interval1.X1;


         // floats
         let xx, yy, xxyy, tmp;
         xx = x0 * x1;
         yy = y0 * y1;
         xxyy = xx * yy;

         tmp = a * xxyy;
         isect1[0] = tmp + b * x1 * yy;
         isect1[1] = tmp + c * x0 * yy;

         tmp = d * xxyy;
         isect2[0] = tmp + e * xx * y1;
         isect2[1] = tmp + f * xx * y0;

         Sort(isect1);
         Sort(isect2);

         return !(isect1[1] < isect2[0] || isect2[1] < isect1[0]);
     }
 }