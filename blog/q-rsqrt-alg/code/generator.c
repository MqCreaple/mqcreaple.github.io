#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
    FILE* fp = fopen("input", "w");
    for(int i = 0; i < 1000000; i++) {
        fprintf(fp, "%.2f\n", (double) rand() / 100);
    }
    fclose(fp);
    return 0;
}