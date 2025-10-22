data F = F F
type T = ()

example1 :: p -> (q -> p)
example1 a = \b -> a

example2 :: (p -> r) -> (q -> r) -> (Either p q -> r)
example2 f g (Left a) = f a
example2 f g (Right b) = g b

example3 :: (p -> q -> r) -> ((p, q) -> r)
example3 f (a, b) = f a b

main :: IO()
main = putStrLn "Hello, World"