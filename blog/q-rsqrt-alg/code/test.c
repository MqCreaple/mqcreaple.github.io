#include <stdio.h>
#include <math.h>
#include <time.h>

float q_rsqrt(float x) {
    long i;
    float x2, y;
    const float threehalves = 1.5F;

    x2 = x * 0.5F;
    y = x;
    i = *(long*) &y;
    i = 0x5f3759df - (i >> 1);
    y = *(float*) &i;
    y = y * (threehalves - (x2 * y * y));
    // y = y * (threehalves - (x2 * y * y));

    return y;
}

int main() {
    FILE* input = fopen("input", "r");
    FILE* output = fopen("output", "w");
    clock_t t1 = clock();
    while(!feof(input)) {
        float f;
        fscanf(input, "%f", &f);
        fprintf(output, "%f\n", q_rsqrt(f));
    }
    clock_t t2 = clock();
    printf("time: %.3f seconds\n", (double)(t2 - t1) / CLOCKS_PER_SEC);
    fclose(input);
    fclose(output);
    return 0;
}