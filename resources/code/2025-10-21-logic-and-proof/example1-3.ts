type F = never;
class T {}

const example1: <P, Q>(a: P) => ((b: Q) => P)
    = <P, Q>(a: P) => {
        return (_: Q) => a;
    };

// const example2: <P, Q, R>(f: (_: P) => R) => (g: (_: Q) => R) => (c: P | Q) => R
//     = ...;  // Unable to write in TypeScript

const example3: <P, Q, R>(f: (_: P) => (_: Q) => R) => ((a: [P, Q]) => R)
    = <P, Q, R>(f: (_: P) => (_: Q) => R) => {
        return (a: [P, Q]) => {
            return f(a[0])(a[1]);
        };
    };