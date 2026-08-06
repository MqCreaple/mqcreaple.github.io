// title: 用AprilTag做姿态估计是一个糟糕的方案
// summary: AprilTag 正对相机时姿态估计的跳跃问题及其改进方法。
// tags: computer-vision, robotics
// category: tech
#import "../../template.typ": article, mathbf, shadertoy-figure, three-js-figure

#show: article.with(
  title: "用AprilTag做姿态估计是一个糟糕的方案",
  lang: "zh",
)

= 背景

去年暑假的时候，我和 #link("https://github.com/shBLOCK")[shBLOCK] 参加了杭州的 Adventure-X 黑客松。彼时我们做了一个空间交互主题的项目，项目链接在这里：#link("https://github.com/shBLOCK/GlassFree3DMod")[https://github.com/shBLOCK/GlassFree3DMod]。这个项目的构想如下：使用笔记本电脑自带的摄像头来拍摄镜头前的人脸和物体，并将其三维位置和姿态映射到游戏空间中，让用户移动真实物体时对应的虚拟物体也同步移动，从而以较低成本实现类似 VR/AR 的交互效果。

一个技术问题困扰了我半年之久：当我们定位单个 AprilTag 时，如果 tag 正好面对着相机，它的姿态定位就会变得不准，如下所示。

#figure(
  image("output-located.gif", width: 70%),
  caption: [在 AprilTag 面向相机时，姿态定位会反复跳跃。图中蓝色、绿色和红色的三条线为定位的 $x$、$y$ 和 $z$ 轴。$z$ 轴的跳动尤其明显。],
) <fig:location>

虽然定位姿态的绝对误差不算大，但如果我们希望使用 AprilTag 定位来做空间交互（比如将实际物体的位姿映射到游戏里的某个虚拟物体），那么这种不连贯性就会造成画面抖动等一系列问题。总之，如果有办法能解决这个姿态跳跃问题，那将会大大提升用户的使用体验。

= 理论

== 射影变换和齐次坐标

当我们用相机拍摄物体时，物体的三维坐标会被映射到相片的二维坐标上。如果我们的相机是一个线性相机，则三维空间中的所有直线经过投影变换之后仍然是直线。因此，这个投影变换是一类射影变换。计算机视觉中通常使用齐次坐标来描述射影变换。比如，$n$ 维欧几里德空间 $RR^n$ 对应的齐次坐标是 $n+1$ 维欧几里德空间 $RR^(n+1)$ 在等价关系 $tilde.op$ 下的商空间：

#set math.equation(numbering: "(1)")
$ tilde.op: RR^(n+1) times RR^(n+1) -> \{top, bot\} \
  mat(delim: "[", mathbf(a)_(1:n); a_(n+1)) tilde.op mat(delim: "[", mathbf(b)_(1:n); b_(n+1)) arrow.l.r.double mathbf(a)_(1:n)/(a_(n+1)) = mathbf(b)_(1:n)/(b_(n+1)) $

也就是说，在齐次坐标中，任何从原点出发的直线上的所有点都被认为是等价的。为了方便阅读，通常将齐次坐标的最后一个维度设成 $1$，将前 $n$ 个维度作为齐次坐标对应的欧氏坐标。定义投影函数：

$ pi: RR^(n+1) -> RR^n \
  pi(mat(delim: "[", mathbf(a)_(1:n); a_(n+1))) = mathbf(a)_(1:n)/(a_(n+1)) $

根据定义，所有在 $tilde.op$ 意义下等价的齐次坐标点都被投影函数 $pi$ 映射到相同的点。

== Perspective-n-Point 问题

对于一个给定的 Tag，其顶点的像素坐标由以下公式计算：

$ mathbf(p)_text("pixel") tilde.op C [R | mathbf(t)] mathbf(p)_text("object") $ <eq:object-to-pixel>

其中 $mathbf(p)_text("pixel")$ 为角点的像素坐标，$mathbf(p)_text("object")$ 为角点在物体局部坐标系的三维坐标。两者均用齐次坐标来表示。对于 AprilTag 这类正方形定位码，$mathbf(p)_text("object")$ 是下列四个点：

$ mathbf(p)_o in \{a/2 mat(delim: "[", -1; 1; 0; 1), a/2 mat(delim: "[", 1; 1; 0; 1), a/2 mat(delim: "[", 1; -1; 0; 1), a/2 mat(delim: "[", -1; -1; 0; 1)\} $

$C$ 为相机的内参矩阵，通常只包含缩放系数 $f_x$、$f_y$ 和平移系数 $c_x$、$c_y$。四个参数的单位均为像素。

$ C = mat(delim: "[", f_x, 0, c_x; 0, f_y, c_y; 0, 0, 1) $

矩阵 $[R | mathbf(t)]$ 为 Tag 参考系到相机参考系的变换矩阵，其中 $R$ 为旋转部分，$mathbf(t)$ 为平移部分。将 $[R | mathbf(t)]$ 乘在齐次向量 $mathbf(p)$ 上即可将点 $mathbf(p)$ 从 Tag 局部参考系转换到相机参考系。

我们要求解的问题是一类特殊的位姿估计问题：在给定相机内参 $C$ 以及一系列 $\{mathbf(p)_text("pixel")^((i))\}_{i=1}^n$ 和对应的 $\{mathbf(p)_text("object")^((i))\}_{i=1}^n$ 时，求解物体的平移 $mathbf(t)$ 和旋转 $R$，即 PnP 问题（Perspective-n-Point）。针对 AprilTag 等平面物体，通常存在比空间中 $n$ 点更优的解法，比如 IPPE 算法 @collins2014ippe。

我们通常使用一个误差函数来量化一个 PnP 问题的解。对于给定的 $\{mathbf(p)_text("pixel")^((i))\}_{i=1}^n$ 和 $\{mathbf(p)_text("object")^((i))\}_{i=1}^n$，定义重投影误差函数为：

$ l_text("reproj")(R, mathbf(t)) = sum_(i=1)^n norm(mathbf(p)_text("pixel")^((i)) - C [R | mathbf(t)] mathbf(p)_text("object")^((i)))_2 $

而 PnP 问题可以看作是寻找最优的 $R$ 和 $mathbf(t)$ 参数来最小化重投影误差。

== 平面物体的单应矩阵

由于 AprilTag 的四个角点处在同一个平面（xOy 平面）内，其坐标可以省去 $z$ 分量，直接用 $x$ 和 $y$ 分量表示。记 $mathbf(p)_text("pixel") = mat(delim: "[", u, v, 1)^T$，$mathbf(p)_text("object") = mat(delim: "[", x, y, 0, 1)^T$，则有：

$ mat(delim: "[", u; v; 1) tilde.op H mat(delim: "[", x; y; 1) $

其中 $H$ 为一个 $3 times 3$ 的矩阵，共 $9 - 1 = 8$ 个自由度，称为该平面物体的单应矩阵。根据 @eq:object-to-pixel，可以建立相机内参、外参和单应矩阵的关系：

$ H = mat(delim: "[", H_11, H_12, H_13; H_21, H_22, H_23; H_31, H_32, 1) tilde.op C [mathbf(r)_x, mathbf(r)_y, mathbf(t)] $ <eq:homography>

$ R = mat(delim: "[", |, |, |; mathbf(r)_x, mathbf(r)_y, mathbf(r)_z; |, |, |) $

由于单应矩阵只涉及平面图像到平面图像的射影变换，相较于立体图像到平面图像的变换更好计算。特别地，对于 AprilTag 这类正方形定位码，由于其平面图像的 4 个角点刚好包含 8 个参数，可以直接据此唯一确定单应矩阵 $H$。

在给定相机参数的情况下，同样可以将单应矩阵看成是旋转 $R$ 和平移 $mathbf(t)$ 的函数，即 $H = H(R, mathbf(t))$。

== SO(3) 流形的表示

一个三维物体的所有可能的旋转构成了一个群，记作 SO(3)，群操作为旋转的复合。不难验证，SO(3) 是一个三维流形，在每个群元素的局部都有三个维度的变换方式。工程上有许多方法来存储 SO(3) 群的元素，包括：

1. 旋转矩阵 $R$：直接存储 $3 times 3$ 的旋转矩阵，共 9 个维度。
2. 旋转向量 $mathbf(omega)$：对于旋转轴为单位向量 $hat(mathbf(omega))$、旋转角为 $theta$ 的旋转变换，记其旋转向量为 $mathbf(omega) = theta hat(mathbf(omega))$。旋转向量是一个三维向量，因此没有信息浪费。旋转向量的性质保证了 SO(3) 的所有元素均可以一一映射到旋转向量空间中以原点为中心、半径为 $pi$ 的三维球体 $cal(B)_pi(mathbf(0))$ 上。
3. 欧拉角：将一个三维旋转 $R$ 分解为三个沿着坐标轴的旋转 $R_z(psi) R_y(theta) R_x(phi)$，其中向量 $[phi, theta, psi]^T$ 即为欧拉角。欧拉角同样仅有三个维度，没有信息浪费，但是三个状态之间有严格的顺序区分，不对称，且存在万向锁问题。
4. 四元数 $q$：四元数用一个实部和 $i$、$j$、$k$ 三个虚部构成。对于沿着旋转轴 $hat(mathbf(omega)) = hat(omega)_x mathbf(i) + hat(omega)_y mathbf(j) + hat(omega)_z mathbf(k)$ 做角度为 $theta$ 的旋转，可以用单位四元数 $q = cos(theta/2) + sin(theta/2)(hat(omega)_x i + hat(omega)_y j + hat(omega)_z k)$ 表示。SO(3) 可以与单位四元数建立一对二的映射。四元数相较于三维的 SO(3) 流形多了一个维度，因此可能会随着误差积累而漂移，需要在运行时检查归一化。

对于旋转向量 $mathbf(omega)$，定义其叉乘矩阵为：

$ [mathbf(omega)]_times = mat(delim: "[", 0, -omega_z, omega_y; omega_z, 0, -omega_x; -omega_y, omega_x, 0) $

对于任意向量 $mathbf(v)$，向量叉乘 $mathbf(omega) times mathbf(v)$ 也可以写成叉乘矩阵乘上向量 $mathbf(v)$，即 $[mathbf(omega)]_times mathbf(v)$。

若向量 $mathbf(omega) = theta hat(mathbf(omega))$ 表示一个旋转向量，其中 $theta = norm(mathbf(omega))$ 为向量模长、$norm(hat(mathbf(omega))) = 1$ 为单位向量，则该向量和旋转矩阵之间可以用罗德里格斯公式转换。

$ R &= I + sin(theta) [hat(mathbf(omega))]_times + (1 - cos(theta)) [hat(mathbf(omega))]_times^2 \
  &= cos(theta) I + sin(theta) [hat(mathbf(omega))]_times + (1 - cos(theta)) hat(mathbf(omega)) hat(mathbf(omega))^T $ <eq:rodrigues>

= 重投影误差分析

回到最初的问题，AprilTag 在面对相机时不断跳动的现象其实已经被研究过了。根据 Collins & Bartoli 的研究 @collins2014ippe，IPPE 问题在特殊情况下有两个解，且这两个解沿着垂直于相机光学中心到 Tag 中心连线的平面镜面对称，如 @fig:duality 所示。

#figure(
  three-js-figure("/js/apriltag-duality.js", body: [_（交互式三维场景，仅在网页版显示。）_]),
  caption: [黄色和紫色的 AprilTag 沿青色面镜像对称。二者在相机平面（灰色平面）上的投影几乎重合。使用鼠标拖拽旋转视角，Shift+鼠标拖拽平移视角，鼠标滚轮放大/缩小。],
) <fig:duality>

向量 $mathbf(v)$ 关于法向量为单位向量 $hat(mathbf(n))$ 的平面的对称为：

$ "refl"_(hat(mathbf(n)))(mathbf(v)) = mathbf(v) - 2 (mathbf(v) dot hat(mathbf(n))) hat(mathbf(n)) $ <eq:refl-vector>

因此，若平面物体的旋转矩阵为

$ R = mat(delim: "[", |, |, |; mathbf(r)_x, mathbf(r)_y, mathbf(r)_z; |, |, |) $

根据 @eq:refl-vector，其关于平面 $hat(mathbf(n))$ 镜面对称后的旋转矩阵为：

$ "refl"_(hat(mathbf(n)))(R) = mat(delim: "[", |, |, |; "refl"_(hat(mathbf(n)))(mathbf(r)_x), "refl"_(hat(mathbf(n)))(mathbf(r)_y), ("refl"_(hat(mathbf(n)))(mathbf(r)_x)) times ("refl"_(hat(mathbf(n)))(mathbf(r)_y)); |, |, |) $ <eq:refl-matrix>

当 Tag 的边长足够小、或者 Tag 距离相机足够远时，可以在 Tag 中心点附近对投影函数做线性展开，将投影变换当作一个仿射变换。此时，垂直于 $mathbf(t)$ 向量的两个 Tag 拥有相同的雅可比矩阵。因此，其四个角点在屏幕空间上会几乎重合，导致一图多解。

#figure(supplement: [定理], caption: none)[
#quote(block: true)[
*定理1：*在相机参数 $C$ 为常数时，令矩阵 $J(R, mathbf(t))$ 为投影变换 $mat(delim: "[", u, v)^T = pi(H(R, mathbf(t)) mat(delim: "[", x, y, 1)^T)$ 在 $(x, y) = (0, 0)$ 附近的雅可比矩阵，即

$ mat(delim: "[", u; v) &= pi(H(R, mathbf(t)) mat(delim: "[", 0; 0; 1)) + J(R, mathbf(t)) mat(delim: "[", x; y) + O(x^2 + y^2) \
  &= pi(C mathbf(t)) + J(R, mathbf(t)) mat(delim: "[", x; y) + O(x^2 + y^2) $

则有 $J(R, mathbf(t)) = J("refl"_(hat(mathbf(t)))(R), mathbf(t))$。

*证明：*代入 @eq:homography、@eq:rodrigues 和 @eq:refl-matrix，使用符号微分即可证明。
]
] <thm:jacobian>

@fig:error-volume 使用体积渲染展示了对于给定的相机参数 $C$ 和 AprilTag 位置 $mathbf(t)$ 时，重投影误差 $l_text("reproj")$ 和 AprilTag 旋转向量 $omega$ 之间的关系。可以看到，在特定角度下，$l_text("reproj")$ 除了在 AprilTag 本身的旋转向量处有一个极值点，在其对称位置也有一个略微高一些的局部极值点。这个现象在 AprilTag 正对相机时最明显。

#figure(
  shadertoy-figure(classes: ("shadertoy-pause", "shadertoy-warning"))[
```glsl
#define PI 3.141592653589793

mat3 rodrigues(vec3 v) {
    float angle = length(v);
    if(angle == 0.) {
        return mat3(1.0);
    }
    vec3 vn = normalize(v);
    mat3 vm = mat3(
        0., vn.z, -vn.y,
        -vn.z, 0., vn.x,
        vn.y, -vn.x, 0.
    );
    return mat3(1.0) + vm * sin(angle) + vm * vm * (1. - cos(angle));
}

const float TAG_SCALE = 40.0;
const mat4x3 TAG_CORNERS = mat4x3(
    -1., +1., 0.,
    +1., +1., 0.,
    +1., -1., 0.,
    -1., -1., 0.
) * TAG_SCALE * 0.5;

const mat3 CAMERA_MAT = mat3(
    1145., 0., 0.,
    0., 1142., 0.,
    960., 540., 1.
);

const vec3 TAG_POS = vec3(-66., -2., 400.);
const vec3 TAG_ROT_1 = vec3(-0.02270, -0.16280, 0.33689);

mat4x3 normalizeHomogeneous(mat4x3 original) {
    return mat4x3(
        original[0] / original[0].z,
        original[1] / original[1].z,
        original[2] / original[2].z,
        original[3] / original[3].z
    );
}

float field(in vec3 p) {
    mat3 tagRotMat = rodrigues(TAG_ROT_1 + vec3(0., 0.3 * sin(iTime), 0.));
    mat4x3 cornersWorld = tagRotMat * TAG_CORNERS + mat4x3(TAG_POS, TAG_POS, TAG_POS, TAG_POS);
    mat4x3 projected = CAMERA_MAT * cornersWorld;
    projected = normalizeHomogeneous(projected);
    mat3 tagRotMat2 = rodrigues(p);
    mat4x3 cornersWorld2 = tagRotMat2 * TAG_CORNERS + mat4x3(TAG_POS, TAG_POS, TAG_POS, TAG_POS);
    mat4x3 projected2 = CAMERA_MAT * cornersWorld2;
    projected2 = normalizeHomogeneous(projected2);
    float sum = 0.0;
    for (int col = 0; col < 4; ++col) {
        vec2 diff = projected[col].xy - projected2[col].xy;
        sum += length(diff);
    }
    return sum / 4.0;
}

float sigmoid(float x) {
    return 1. / (1. + exp(-x));
}

vec3 field2rgb(float val) {
    // convert the field value to an RGB absorbance value, where
    // `r`, `g`, and `b` are the rate of absorbace for three colours per length (base e).
    // If a light with initial color (rc, gc, bc) penetrates length l in the medium,
    // its final color will be (rc * exp(-r * l), gc * exp(-g * l), bc * exp(-b * l))
    const vec3 RED = vec3(0.12, 0.80, 0.80);
    const vec3 BLUE = vec3(0.68, 0.55, 0.02);
    return (20. * sigmoid((2.0 - val) * 3.0)) * mix(RED, BLUE, exp(-val * 0.8));
}

float sdBall(in vec3 p) {
    // return max(length(p) - 0.6, p.z - 0.6 * sin(iTime));
    return max(-p.z, length(p) - 0.8);
}

float sdAxes(in vec3 p, out int obj) {
    // 1 = x axis, 2 = y axis, 3 = z axis
    // 4 = other reference points
    const float AXIS_RADIUS = 0.002;
    float dist = min(length(p.yz) - AXIS_RADIUS, length(vec3(fract(p.x), p.yz)) - AXIS_RADIUS * 4.);
    obj = 1;
    float distY = min(length(p.zx) - AXIS_RADIUS, length(vec3(fract(p.y), p.zx)) - AXIS_RADIUS * 4.);
    if(distY < dist) {
        dist = distY;
        obj = 2;
    }
    float distZ = min(length(p.xy) - AXIS_RADIUS, length(vec3(fract(p.z), p.xy)) - AXIS_RADIUS * 4.);
    if(distZ < dist) {
        dist = distZ;
        obj = 3;
    }
    float distPt = length(p - TAG_ROT_1  - vec3(0., 0.3 * sin(iTime), 0.)) - AXIS_RADIUS * 2.;
    if(distPt < dist) {
        dist = distPt;
        obj = 4;
    }
    return dist;
}

float sdf(in vec3 p, out int obj) {
    // obj: 0 = ball, 1~3 = axes
    float dist = sdBall(p);
    float distAxes = sdAxes(p, obj);
    if(distAxes > dist) {
        obj = 0;
    }
    return min(distAxes, dist);
}

const vec3 BACKGROUND_COLOR = vec3(1.0);
vec3 traceAxes(in vec3 origin, in vec3 direction, float tMin, float tMax) {
    float t = tMin;
    while(t <= tMax) {
        int object;
        float dt = sdAxes(origin + t * direction, object);
        if(dt > 5e-4) {
            t += dt;
            continue;
        }
        // intersect
        vec3 point = origin + t * direction;
        return mat4x3(1.0)[object-1];
    }
    return BACKGROUND_COLOR;
}

vec3 trace(in vec3 origin, in vec3 direction, float tMin, float tMax) {
    float t = tMin;
    while(t <= tMax) {
        int object;
        float dt = sdf(origin + t * direction, object);
        if(dt > 5e-4) {
            t += dt;
            continue;
        }
        // intersect
        vec3 point = origin + t * direction;
        vec3 color;
        if(object >= 1 && object <= 3) {
            return mat4x3(1.0)[object-1];
        } else {
            // intersected with the ball
            vec3 absorbance = vec3(0.0);
            const float STEP = 5e-4;
            float lastDist = sdBall(origin + t * direction);
            // int stepcnt = 0;
            for(int i = 0; i < 100; i++) {
                vec3 p = origin + t * direction;
                const float EPS = 1e-4;
                float gradAlongDir = (field(p + EPS * direction) - field(p - EPS * direction)) / (2. * EPS);
                float dt = min(STEP * (1.0 + 20.0 / (1.0 + gradAlongDir * gradAlongDir * 1e-6)), sdAxes(p, object));
                if(dt < STEP * 0.5) {
                    // intersect with the axes
                    vec3 axisColor = mat4x3(1.0)[object-1];
                    return axisColor * exp(-absorbance);
                }
                absorbance += dt * field2rgb(field(p));
                t += dt;
                float dist = sdBall(origin + t * direction);
                if(dist > 0.0 && dist > lastDist) {
                    break;
                }
                lastDist = dist;
                // stepcnt++;
            }
            // return vec3(float(stepcnt) / 400.0);
            return traceAxes(origin + t * direction, direction, 0.0, tMax) * exp(-absorbance);
            // return field2rgb(field(point));
        }
    }
    return BACKGROUND_COLOR;
}

mat4 toMat(float yaw, float pitch, float scale) {
    float cy = cos(yaw);
    float sy = sin(yaw);
    float cp = cos(pitch);
    float sp = sin(pitch);
    return mat4(cy, sy, 0.0, 0.0,
                -sy, cy, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0)
        * mat4(1.0, 0.0, 0.0, 0.0,
                0.0, cp, -sp, 0.0,
                0.0, sp, cp, 0.0,
                0.0, 0.0, 0.0, 1.0)
        * mat4(1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, scale, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
    uv.x *= iResolution.x / iResolution.y;

    float yaw = iMouse.x / iResolution.x * 2. * PI;
    // float yaw = 0.78539;
    float pitch = iMouse.y / iResolution.y * PI;
    float scale = 0.8;
    mat4 mat = toMat(yaw, pitch, scale);

    vec3 origin = (mat * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 ray = (mat * vec4(uv, -1.0, 1.0)).xyz;
    vec3 dir = normalize(ray - origin);
    float tMin = 0.1;
    vec3 color = trace(origin, dir, tMin, 300.0);

    fragColor = vec4(color, 1.0);
}
```
  ],
  caption: [重投影误差 $l_text("reproj")$ 和相机旋转向量 $omega$ 之间的关系。红、绿、蓝三根坐标轴分别对应 $omega_x$、$omega_y$ 和 $omega_z$。图中染色区域大致对应 $l_text("reproj") lt 2.0$ 的区间，颜色越深表示对应的 $l_text("reproj")(omega_x mathbf(i) + omega_y mathbf(j) + omega_z mathbf(k))$ 越小。相机参数 $f_x = 1145, f_y = 1142, c_x = 960, c_y = 540$（单位：像素）；AprilTag 中心点位置 $mathbf(t) = -66 mathbf(i) - 2 mathbf(j) + 400 mathbf(k)$（单位：毫米）；AprilTag 旋转向量随时间变化函数为 $mathbf(omega) = -0.02270 mathbf(i) + (-0.16280 + 0.3 sin(t)) mathbf(j) + 0.33689 mathbf(k)$。图中的黑色点标记了 AprilTag 的真实旋转向量。当 $t = k pi, k in ZZ$ 时，AprilTag 正好垂直于其中心点到相机连线。],
) <fig:error-volume>

不仅如此，从 @fig:error-volume 中也可以看出，在 Tag 面对相机时，不仅会出现双解的问题，解附近的重投影函数也更加平缓，相应的误差也会增大。在真实场景中，角点检测的误差很容易导致定位精度下降，亦或者是在多个解之间反复跳跃。

= 改进方法

== 立体图案

@thm:jacobian 意味着对于平面图案，只要它在屏幕上所占区域小到一定程度，就不可避免地出现双解。因此，如果希望通过相机获得更加精准的定位，平面图案或许不是最好的选择。@fig:tetrahedron-error 展示了将四个角点排列成一个底面半径相同的正四面体时的重投影误差（假设能从相机同时看到四个点）。从图中可以看出，当四个角不在同一平面上时，重投影误差在定位点附近会陡峭很多，可以有效降低定位误差。

#figure(
  shadertoy-figure(classes: ("shadertoy-pause", "shadertoy-warning"))[
```glsl
#define PI 3.141592653589793
#define SQRT2 1.4142135623730951
#define SQRT3 1.7320508075688772

mat3 rodrigues(vec3 v) {
    float angle = length(v);
    if(angle == 0.) {
        return mat3(1.0);
    }
    vec3 vn = normalize(v);
    mat3 vm = mat3(
        0., vn.z, -vn.y,
        -vn.z, 0., vn.x,
        vn.y, -vn.x, 0.
    );
    return mat3(1.0) + vm * sin(angle) + vm * vm * (1. - cos(angle));
}

const float TAG_SCALE = 40.0;
const mat4x3 TAG_CORNERS = mat4x3(
    1., 0., 0.,
    -0.5, +0.5 * SQRT3, 0.,
    -0.5, -0.5 * SQRT3, 0.,
    0., 0., SQRT2
) * TAG_SCALE * 0.5;

const mat3 CAMERA_MAT = mat3(
    1145., 0., 0.,
    0., 1142., 0.,
    960., 540., 1.
);

const vec3 TAG_POS = vec3(-66., -2., 400.);
const vec3 TAG_ROT_1 = vec3(-0.02270, -0.16280, 0.33689);

mat4x3 normalizeHomogeneous(mat4x3 original) {
    return mat4x3(
        original[0] / original[0].z,
        original[1] / original[1].z,
        original[2] / original[2].z,
        original[3] / original[3].z
    );
}

float field(in vec3 p) {
    mat3 tagRotMat = rodrigues(TAG_ROT_1 + vec3(0., 0.3 * sin(iTime), 0.));
    mat4x3 cornersWorld = tagRotMat * TAG_CORNERS + mat4x3(TAG_POS, TAG_POS, TAG_POS, TAG_POS);
    mat4x3 projected = CAMERA_MAT * cornersWorld;
    projected = normalizeHomogeneous(projected);
    mat3 tagRotMat2 = rodrigues(p);
    mat4x3 cornersWorld2 = tagRotMat2 * TAG_CORNERS + mat4x3(TAG_POS, TAG_POS, TAG_POS, TAG_POS);
    mat4x3 projected2 = CAMERA_MAT * cornersWorld2;
    projected2 = normalizeHomogeneous(projected2);
    float sum = 0.0;
    for (int col = 0; col < 4; ++col) {
        vec2 diff = projected[col].xy - projected2[col].xy;
        sum += length(diff);
    }
    return sum / 4.0;
}

float sigmoid(float x) {
    return 1. / (1. + exp(-x));
}

vec3 field2rgb(float val) {
    // convert the field value to an RGB absorbance value, where
    // `r`, `g`, and `b` are the rate of absorbace for three colours per length (base e).
    // If a light with initial color (rc, gc, bc) penetrates length l in the medium,
    // its final color will be (rc * exp(-r * l), gc * exp(-g * l), bc * exp(-b * l))
    const vec3 RED = vec3(0.12, 0.80, 0.80);
    const vec3 BLUE = vec3(0.68, 0.55, 0.02);
    return (20. * sigmoid((2.0 - val) * 3.0)) * mix(RED, BLUE, exp(-val * 0.8));
}

float sdBall(in vec3 p) {
    // return max(length(p) - 0.6, p.z - 0.6 * sin(iTime));
    return max(-p.z, length(p) - 0.8);
}

float sdAxes(in vec3 p, out int obj) {
    // 1 = x axis, 2 = y axis, 3 = z axis
    // 4 = other reference points
    const float AXIS_RADIUS = 0.002;
    float dist = min(length(p.yz) - AXIS_RADIUS, length(vec3(fract(p.x), p.yz)) - AXIS_RADIUS * 4.);
    obj = 1;
    float distY = min(length(p.zx) - AXIS_RADIUS, length(vec3(fract(p.y), p.zx)) - AXIS_RADIUS * 4.);
    if(distY < dist) {
        dist = distY;
        obj = 2;
    }
    float distZ = min(length(p.xy) - AXIS_RADIUS, length(vec3(fract(p.z), p.xy)) - AXIS_RADIUS * 4.);
    if(distZ < dist) {
        dist = distZ;
        obj = 3;
    }
    float distPt = length(p - TAG_ROT_1  - vec3(0., 0.3 * sin(iTime), 0.)) - AXIS_RADIUS * 2.;
    if(distPt < dist) {
        dist = distPt;
        obj = 4;
    }
    return dist;
}

float sdf(in vec3 p, out int obj) {
    // obj: 0 = ball, 1~3 = axes
    float dist = sdBall(p);
    float distAxes = sdAxes(p, obj);
    if(distAxes > dist) {
        obj = 0;
    }
    return min(distAxes, dist);
}

const vec3 BACKGROUND_COLOR = vec3(1.0);
vec3 traceAxes(in vec3 origin, in vec3 direction, float tMin, float tMax) {
    float t = tMin;
    while(t <= tMax) {
        int object;
        float dt = sdAxes(origin + t * direction, object);
        if(dt > 5e-4) {
            t += dt;
            continue;
        }
        // intersect
        vec3 point = origin + t * direction;
        return mat4x3(1.0)[object-1];
    }
    return BACKGROUND_COLOR;
}

vec3 trace(in vec3 origin, in vec3 direction, float tMin, float tMax) {
    float t = tMin;
    while(t <= tMax) {
        int object;
        float dt = sdf(origin + t * direction, object);
        if(dt > 5e-4) {
            t += dt;
            continue;
        }
        // intersect
        vec3 point = origin + t * direction;
        vec3 color;
        if(object >= 1 && object <= 3) {
            return mat4x3(1.0)[object-1];
        } else {
            // intersected with the ball
            vec3 absorbance = vec3(0.0);
            const float STEP = 5e-4;
            float lastDist = sdBall(origin + t * direction);
            // int stepcnt = 0;
            for(int i = 0; i < 100; i++) {
                vec3 p = origin + t * direction;
                const float EPS = 1e-4;
                float gradAlongDir = (field(p + EPS * direction) - field(p - EPS * direction)) / (2. * EPS);
                float dt = min(STEP * (1.0 + 20.0 / (1.0 + gradAlongDir * gradAlongDir * 1e-6)), sdAxes(p, object));
                if(dt < STEP * 0.5) {
                    // intersect with the axes
                    vec3 axisColor = mat4x3(1.0)[object-1];
                    return axisColor * exp(-absorbance);
                }
                absorbance += dt * field2rgb(field(p));
                t += dt;
                float dist = sdBall(origin + t * direction);
                if(dist > 0.0 && dist > lastDist) {
                    break;
                }
                lastDist = dist;
                // stepcnt++;
            }
            // return vec3(float(stepcnt) / 400.0);
            return traceAxes(origin + t * direction, direction, 0.0, tMax) * exp(-absorbance);
            // return field2rgb(field(point));
        }
    }
    return BACKGROUND_COLOR;
}

mat4 toMat(float yaw, float pitch, float scale) {
    float cy = cos(yaw);
    float sy = sin(yaw);
    float cp = cos(pitch);
    float sp = sin(pitch);
    return mat4(cy, sy, 0.0, 0.0,
                -sy, cy, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0)
        * mat4(1.0, 0.0, 0.0, 0.0,
                0.0, cp, -sp, 0.0,
                0.0, sp, cp, 0.0,
                0.0, 0.0, 0.0, 1.0)
        * mat4(1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, scale, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv * vec2(2.0, -2.0) + vec2(-1.0, 1.0);
    uv.x *= iResolution.x / iResolution.y;

    float yaw = iMouse.x / iResolution.x * 2. * PI;
    // float yaw = 0.78539;
    float pitch = iMouse.y / iResolution.y * PI;
    float scale = 0.8;
    mat4 mat = toMat(yaw, pitch, scale);

    vec3 origin = (mat * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 ray = (mat * vec4(uv, -1.0, 1.0)).xyz;
    vec3 dir = normalize(ray - origin);
    float tMin = 0.1;
    vec3 color = trace(origin, dir, tMin, 300.0);

    fragColor = vec4(color, 1.0);
}
```
  ],
  caption: [正四面体图案的重投影误差。染色区域大致对应 $l_text("reproj") lt 2.0$ 的区间。相机参数 $f_x = 1145, f_y = 1142, c_x = 960, c_y = 540$（单位：像素）；AprilTag 中心点位置 $mathbf(t) = -66 mathbf(i) - 2 mathbf(j) + 400 mathbf(k)$（单位：毫米）；AprilTag 旋转向量随时间变化函数为 $mathbf(omega) = -0.02270 mathbf(i) + (-0.16280 + 0.3 sin(t)) mathbf(j) + 0.33689 mathbf(k)$。],
) <fig:tetrahedron-error>

== 多传感器融合与后处理

由于 AprilTag 等平面定位图案的易得性，在许多应用场景下仍然有不可替代的价值。可以在定位时加入恰当的后处理算法来提高定位精度，如：使用扩展卡尔曼滤波 @im2024kalman 对 Tag 的姿态作平滑化，并在多个解出现时选择最接近当前估计的解。此外，IMU 传感器数据也可以作为辅助信息加入定位算法中，通过多传感器融合进一步提高定位精度。

#figure(
  table(
    columns: 2,
    image("output-located-unfiltered.gif", width: 100%),
    image("output-located-filtered.gif", width: 100%),
  ),
  caption: [两种定位算法对比：(a) 使用 solvePnP-IPPE 解算 AprilTag 位姿；(b) 使用误差卡尔曼滤波对 AprilTag 轨迹做平滑化处理。],
) <fig:comparison>

= 总结

AprilTag 在正对相机时会出现姿态估计的跳跃和不稳定现象，其根本原因在于平面物体的投影变换存在双解——两个镜面对称的位姿会产生几乎相同的重投影误差。当 Tag 距离相机较远或边长较小时，这一问题尤为突出，导致误差函数平坦、解空间出现局部极小值。虽然通过立体图案可以显著改善定位精度，但在实际应用中，平面码的易用性使其仍被广泛采用。此时，引入扩展卡尔曼滤波或多传感器融合等后处理手段，能够有效抑制抖动，提升轨迹的连续性与稳定性。总体而言，AprilTag 并非姿态估计的通用最优解，理解其局限性并针对场景选择合适的方法，才是实现可靠空间交互的关键。

= 参考资料

#bibliography("reference.bib", full: true)
