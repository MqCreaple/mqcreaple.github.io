using LoopVectorization

function integrate(y, x; dim::Int=1)
    """Integrate y with respect to x, using trapezoidal rule."""
    if ndims(y) == 1
        @assert length(x) == length(y)
        integral = 0.0
        @inbounds for i in 1:(length(x)-1)
            integral += (y[i] + y[i+1]) * (x[i+1] - x[i]) / 2
        end
        return integral
    else
        integral = similar(selectdim(y, dim, 1))
        @inbounds for i in 1:(length(x)-1)
            integral += (selectdim(y, dim, i) + selectdim(y, dim, i+1)) * (x[i+1] - x[i]) * 0.5
        end
        return integral
    end
end

function derivative(y, x; dim::Int=1)
    """First-order derivative of y with respect to x, using central difference."""
    dy = similar(y)
    if ndims(y) == 1
        @assert length(y) == length(x)
        dy[1] = (y[2] - y[1]) / (x[2] - x[1])
        dy[begin+1:end-1] = (y[begin+2:end] - y[begin:end-2]) ./ (x[begin+2:end] - x[begin:end-2])
        dy[end] = (y[end] - y[end-1]) / (x[end] - x[end-1])
    else
        len = size(y, dim)
        @assert len == length(x)
        copyto!(selectdim(dy, dim, 1), (selectdim(y, dim, 2) - selectdim(y, dim, 1)) ./ (x[2] - x[1]))
        @inbounds for i in 2:len-1
            copyto!(selectdim(dy, dim, i), (selectdim(y, dim, i+1) - selectdim(y, dim, i-1)) ./ (x[i+1] - x[i-1]))
        end
        copyto!(selectdim(dy, dim, len), (selectdim(y, dim, len) - selectdim(y, dim, len - 1)) ./ (x[end] - x[end-1]))
    end
    return dy
end

function derivative2(y, x; dim::Int=1)
    """Second-order derivative of y with respect to x, using central difference."""
    dy = similar(y)
    if ndims(y) == 1
        @assert length(y) == length(x)
        dy[1] = (y[3] - 2*y[2] + y[1]) / (x[2] - x[1])^2
        dy[begin+1:end-1] = (y[begin+2:end] - 2 * y[begin+1:end-1] + y[begin:end-2]) ./ (0.25 .* (x[begin+2:end] - x[begin:end-2]) .^ 2)
        dy[end] = (y[end] - 2*y[end-1] + y[end-2]) / (x[end] - x[end-1])^2
    else
        len = size(y, dim)
        @assert len == length(x)
        copyto!(selectdim(dy, dim, 1), (selectdim(y, dim, 3) - 2 * selectdim(y, dim, 2) + selectdim(y, dim, 1)) ./ (x[2] - x[1])^2)
        @inbounds for i in 2:len-1
            copyto!(selectdim(dy, dim, i), (selectdim(y, dim, i+1) - 2 * selectdim(y, dim, i) + selectdim(y, dim, i-1)) ./ (0.25 * (x[i+1] - x[i-1])^2))
        end
        copyto!(selectdim(dy, dim, len), (selectdim(y, dim, len) - 2 * selectdim(y, dim, len-1) + selectdim(y, dim, len-2)) ./ (x[end] - x[end-1])^2)
    end
    return dy
end
