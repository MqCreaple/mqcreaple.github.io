using Plots
using ProgressBars
using Base.Threads
cd(@__DIR__)

include("helpers.jl")

const PENDULUM_MASS = 1.0  # kg
const PENDULUM_LENGTH = 1.0  # m

const g = 9.81  # m/s^2
# use the Lagrangian of a simple pendulum
Lagrange(t, q, q̇) = 0.5 * PENDULUM_MASS * PENDULUM_LENGTH^2 * q̇^2 + PENDULUM_MASS * g * PENDULUM_LENGTH * cos.(q)
Lagrange_(t, q, q̇, q̈) = -PENDULUM_MASS * PENDULUM_LENGTH * g * sin.(q) - PENDULUM_MASS * PENDULUM_LENGTH^2 * q̈

const N = 250  # the number of samples for the q(t) curve
const t1 = 0
const t2 = 10
const times = range(t1, t2, length=N)  # the time points for the q(t) curve
q = randn(N) * 0.01  # the initial values for the q(t) curve
q[begin] = π / 16
q[end] = -π / 20

# optimizing code
const LearnRate = 5e-4
const RECORD_HISTORY_PER_ITER = 1000
loss_history = []
# Adam updater
const adam_v = zeros(N)
const adam_s = zeros(N)
const β1 = 0.9
const β2 = 0.999
const ϵ = 1e-5

# optimization loop
anim = @animate for iteration in ProgressBar(1:10000)
    global times, q
    # do one step of gradient descent in this loop
    # first, calculate samples of q(t), q̇(t), q̈(t)
    q̇ = derivative(q, times)
    q̈ = derivative2(q, times)
    # calculate the loss gradient
    loss_grad = Lagrange_(times, q, q̇, q̈)
    # update the Adam parameters
    adam_v .= β1 * adam_v + (1 - β1) * loss_grad
    adam_s .= β2 * adam_s + (1 - β2) * loss_grad.^2
    # bias correction
    v_hat = adam_v / (1 - β1^iteration)
    s_hat = adam_s / (1 - β2^iteration)
    # update the q(t) curve
    @inbounds q[begin+1:end-1] -= LearnRate * v_hat[begin+1:end-1] ./ (sqrt.(s_hat[begin+1:end-1]) .+ ϵ)
    # record the loss
    if iteration % RECORD_HISTORY_PER_ITER == 0
        push!(loss_history, sqrt(integrate(loss_grad.^2, times)))
    end
    plot(times, q, label="pendulum path", legend=nothing)
end every 5000

gif(anim, "pendulum.gif", fps=10)

# plot the q curve after optimization
plot(times, q, label="q(t) optimized")
savefig("pendulum.svg")

plot(times[begin+1:end-1], derivative2(q, times)[begin+1:end-1], label="q̈(t)")
savefig("pendulum-acceleration.svg")

# plot the loss history
plot(loss_history, label="loss history", yaxis=:log, legend=:topleft, xlabel="iteration", ylabel="loss")
savefig("loss.png")