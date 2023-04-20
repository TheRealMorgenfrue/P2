import {gaussianElimination, hasSolutions, isRowEchelonForm, isUpperTriangular} from "../scripts/app_math.js";

test('consistent matrix with unique solution: hasSolutions returns true', () => {
    let consistent_matrix = [
        [1,2,1,-1,5],
        [3,2,4,4,16],
        [4,4,3,4,22],
        [2,0,1,5,15]]
    gaussianElimination(consistent_matrix);
    expect(hasSolutions(consistent_matrix)).toEqual(true);
});
test('inconsistent matrix: hasSolutions returns false', () => {
    let inconsistent_matrix = [
        [1,1,1],
        [1,0,-1],
        [1,-1,0]]
    gaussianElimination(inconsistent_matrix);
    expect(hasSolutions(inconsistent_matrix)).toEqual(false);

});

test('over-determined matrix with multiple solutions: hasSolutions returns true', () => {
    let over_determined_matrix = [
        [1,1,1],
        [1,1,1],
        [1,1,1],
        [1,1,1]]
    gaussianElimination(over_determined_matrix);
    expect(hasSolutions(over_determined_matrix)).toEqual(true);
});

test('matrix with small digits, to show partial pivot: hasSolutions returns true ', () => {
    let small_valued_matrix = [
        [0.02,0.01,0,0,0.02],
        [1,2,1,0,1],
        [0,1,2,1,4],
        [0,0,100,200,800]]
    gaussianElimination(small_valued_matrix);
    expect(hasSolutions(small_valued_matrix)).toEqual(true)
});
test('under-determined matrix with multiple solutions: hasSolutions returns true', () => {
    let wide_matrix = [
        [1,1,0,1],
        [0,1,1,2]]
    gaussianElimination(wide_matrix);
    expect(hasSolutions(wide_matrix)).toEqual(true)
});

test('Checks if isRowEchelon correctly identifies matrices', () => {
    let matrix1 = [
        [0,0,0],
        [0,1,0],
        [0,0,1]
    ]
    let matrix2 = [
        [1,1,1],
        [0,0,0],
        [0,0,1]
    ]
    let matrix3 = [
        [1,0,0,0],
        [1,1,0,0],
        [1,0,1,0]
    ]
    let matrix4 = [
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0]
    ]
    let matrix5 = [
        [1,1,1,1],
        [0,0,1,1],
        [0,0,0,0]
    ]
    let matrix6 = [[1]];
    let matrix7 = [[0]];
    expect(isRowEchelonForm(matrix1)).toBe(false);
    expect(isRowEchelonForm(matrix2)).toBe(false);
    expect(isRowEchelonForm(matrix3)).toBe(false);
    expect(isRowEchelonForm(matrix4)).toBe(true);
    expect(isRowEchelonForm(matrix5)).toBe(true);
    expect(isRowEchelonForm(matrix6)).toBe(true);
    expect(isRowEchelonForm(matrix7)).toBe(true);
});

test('Checks if isUpperTriangular correctly identifies matrices', () => {
    let matrix1 = [
        [0,0,0],
        [0,1,0],
        [0,0,1]
    ]
    let matrix2 = [
        [1,1,1],
        [0,0,0],
        [0,0,1]
    ]
    let matrix3 = [
        [1,0,0,0],
        [1,1,0,0],
        [1,0,1,0]
    ]
    let matrix4 = [
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0]
    ]
    let matrix5 = [
        [1,1,1,1],
        [0,0,1,1],
        [1,0,0,0]
    ]
    let matrix6 = [[1]];
    let matrix7 = [[0]];
    expect(isUpperTriangular(matrix1)).toBe(true);
    expect(isUpperTriangular(matrix2)).toBe(true);
    expect(isUpperTriangular(matrix3)).toBe(false);
    expect(isUpperTriangular(matrix4)).toBe(true);
    expect(isUpperTriangular(matrix5)).toBe(false);
    expect(isUpperTriangular(matrix6)).toBe(true);
    expect(isUpperTriangular(matrix7)).toBe(true);
});