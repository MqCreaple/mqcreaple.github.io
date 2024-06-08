using Plots
using ProgressBars
using Base.Threads
cd(@__DIR__)

include("helpers.jl")

const Mass = [1.0e30, 1.0e30, 1.0e30]
const GravitationalConst = 6.67408e-11

# Here, the q and q̇ are vectors, whose lengths equal to the degree of freedom of the system
function Lagrange(t, q, q̇)
    x = q[1:3, :]
    y = q[4:6, :]
    ẋ = q̇[1:3, :]
    ẏ = q̇[4:6, :]
    potential = sum(Mass[i] * Mass[j] / hypot(x[i] - x[j], y[i] - y[j]) for (i, j) in [(1, 2), (2, 3), (3, 1)])
    return sum(0.5 * Mass .* (ẋ.^2 + ẏ.^2)) + GravitationalConst * potential
end

function Lagrange_(t, q, q̇, q̈)
    x = @view q[1:3, :]
    y = @view q[4:6, :]
    T12 = GravitationalConst * Mass[1] * Mass[2] ./ hypot.(x[1, :] - x[2, :], y[1, :] - y[2, :]) .^ 3
    T23 = GravitationalConst * Mass[2] * Mass[3] ./ hypot.(x[2, :] - x[3, :], y[2, :] - y[3, :]) .^ 3
    T31 = GravitationalConst * Mass[3] * Mass[1] ./ hypot.(x[3, :] - x[1, :], y[3, :] - y[1, :]) .^ 3
    X12 = T12 .* (x[1, :] - x[2, :])
    X23 = T23 .* (x[2, :] - x[3, :])
    X31 = T31 .* (x[3, :] - x[1, :])
    Y12 = T12 .* (y[1, :] - y[2, :])
    Y23 = T23 .* (y[2, :] - y[3, :])
    Y31 = T31 .* (y[3, :] - y[1, :])
    ans = similar(q)
    ans[1, :] = -X12 + X31 - Mass[1] * q̈[1, :]
    ans[2, :] = -X23 + X12 - Mass[2] * q̈[2, :]
    ans[3, :] = -X31 + X23 - Mass[3] * q̈[3, :]
    ans[4, :] = -Y12 + Y31 - Mass[1] * q̈[4, :]
    ans[5, :] = -Y23 + Y12 - Mass[2] * q̈[5, :]
    ans[6, :] = -Y31 + Y23 - Mass[3] * q̈[6, :]
    return ans
end

const N = 250  # the number of samples for the q(t) curve
const t1 = 0
const t2 = 1e10
const times = LinRange(t1, t2, N)  # the time points for the q(t) curve

const QStart = [1, -0.5, -0.5, 0, sqrt(3)/2, -sqrt(3)/2] * 5e12
const QEnd = [-0.5, -0.5, 1, sqrt(3)/2, -sqrt(3)/2, 0] * 5e12

λ = LinRange(0, 1, N)
q = QEnd * λ' + QStart * (1 .- λ)' + cat(zeros((6, 1)), randn(6, N-2) * 5e11, zeros(6, 1); dims=1)  # the initial values for the q(t) curve

# optimizing code
const LearnRate = 2e7
const RECORD_HISTORY_PER_ITER = 1000
loss_history = []
# Adam updater
const adam_v = zeros(6, N)
const adam_s = zeros(6, N)
const β1 = 0.9
const β2 = 0.999
const ϵ = 1e-5

# optimization loop
@time anim = @animate for iteration in ProgressBar(1:500000)
    global times, q
    if any(isnan.(q))
        print("NaN detected, break at iteration $iteration")
        break
    end
    # do one step of gradient descent in this loop
    # first, calculate samples of q(t), q̇(t), q̈(t)
    q̇ = derivative(q, times; dim=2)
    q̈ = derivative2(q, times; dim=2)
    # calculate the loss gradient
    loss_grad = Lagrange_(times, q, q̇, q̈)
    # update the Adam parameters
    adam_v .= β1 * adam_v + (1 - β1) * loss_grad
    adam_s .= β2 * adam_s + (1 - β2) * loss_grad.^2
    # bias correction
    v_hat = adam_v / (1 - β1^iteration)
    s_hat = adam_s / (1 - β2^iteration)
    # update the q(t) curve
    @inbounds q[:, begin+1:end-1] -= LearnRate * v_hat[:, begin+1:end-1] ./ (sqrt.(s_hat[:, begin+1:end-1]) .+ ϵ)
    # record the loss
    if iteration % RECORD_HISTORY_PER_ITER == 0
        push!(loss_history, sqrt(sum(abs, integrate(loss_grad.^2, times; dim=2)) / 6))
    end
    plot(q[1, :], q[4, :], label="star 1", lc=:red)
    plot!(q[2, :], q[5, :], label="star 2", lc=:green)
    plot!(q[3, :], q[6, :], label="star 3", lc=:blue)
end every 5000

gif(anim, "3-body-train.gif", fps=10)

anim2 = @animate for i in axes(q, 2)
    # animate the final path of the 3 stars
    plot(q[1, max(1, i-50):i], q[4, max(1, i-50):i], lc=:red, xlim=(-1e13, 1e13), ylim=(-1e13, 1e13), label=nothing)
    plot!(q[2, max(1, i-50):i], q[5, max(1, i-50):i], lc=:green, label=nothing)
    plot!(q[3, max(1, i-50):i], q[6, max(1, i-50):i], lc=:blue, label=nothing)
    scatter!([q[1, i]], [q[4, i]], mc=:red, label="star 1")
    scatter!([q[2, i]], [q[5, i]], mc=:green, label="star 2")
    scatter!([q[3, i]], [q[6, i]], mc=:blue, label="star 3")
end every 1

gif(anim2, "3-body.gif", fps=10)

# plot the loss history
plot(loss_history, label="loss history", yaxis=:log, legend=:topleft, xlabel="iteration", ylabel="loss")
savefig("3-body-loss.png")

# print out the initial position and velocity
println("Initial position:")
println(q[:, 1])
println("Initial velocity:")
println(derivative(q, times; dim=2)[:, 1])