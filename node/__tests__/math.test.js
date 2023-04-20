import {gaussianElimination, backSubstitution, hasSolutions} from "../scripts/app_math.js";

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

/*
// Tests using back-substitution that are probably unnecessary
test('backSubstitution returns solution for solvable matrix with equal number of equations and variables', () => {
    let consistent_matrix = [
        [1,2,1,-1,5],
        [3,2,4,4,16],
        [4,4,3,4,22],
        [2,0,1,5,15]]
    gaussianElimination(consistent_matrix);
    expect(backSubstitution(consistent_matrix)).toEqual([16,-6,-2,-3]);
});
test('backSubstitution returns NaN when given an inconsistent system of equations', () => {
    let inconsistent_matrix = [
        [1,1,1],
        [1,0,-1],
        [1,-1,0]]
    gaussianElimination(inconsistent_matrix);
    expect(backSubstitution(inconsistent_matrix)).toEqual(NaN);

});

test('backSubstitution returns NaN when given an overdetermined system', () => {
    let over_determined_matrix = [
        [1,1,1],
        [1,1,1],
        [1,1,1],
        [1,1,1]]
    gaussianElimination(over_determined_matrix);
    expect(backSubstitution(over_determined_matrix)).toEqual(NaN);
});

test('backSubstitution has minimal rounding', () => {
    let small_valued_matrix = [
        [0.02,0.01,0,0,0.02],
        [1,2,1,0,1],
        [0,1,2,1,4],
        [0,0,100,200,800]]
    gaussianElimination(small_valued_matrix);
    expect(backSubstitution(small_valued_matrix)).toEqual([1,0,0,4])
});
test('backSubstitution for under-determined gives one out of infinite solutions', () => {
    let small_valued_matrix = [
        [1,1,0,1],
        [0,1,1,2]]
    gaussianElimination(small_valued_matrix);
    expect(backSubstitution(small_valued_matrix)).toEqual([-1,2,0])
});
 */