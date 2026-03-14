npm run lint > lint_output.txt 2>&1
npm run type-check > type_output.txt 2>&1
npm run test -- --run > test_output.txt 2>&1
npm run build > build_output.txt 2>&1
git merge --no-commit --no-ff main > merge_conflicts.txt 2>&1
git merge --abort
