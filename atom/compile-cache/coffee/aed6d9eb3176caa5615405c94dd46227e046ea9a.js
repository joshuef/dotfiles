(function() {
  var originalPackageConfig;

  originalPackageConfig = atom.config.get('auto-update-packages');

  window.restoreEnvironment = function() {
    return atom.config.set('auto-update-packages', originalPackageConfig);
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvYXV0by11cGRhdGUtcGFja2FnZXMvc3BlYy9zcGVjLWhlbHBlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLHFCQUFBLEdBQXdCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQkFBaEI7O0VBRXhCLE1BQU0sQ0FBQyxrQkFBUCxHQUE0QixTQUFBO1dBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixzQkFBaEIsRUFBd0MscUJBQXhDO0VBRDBCO0FBRjVCIiwic291cmNlc0NvbnRlbnQiOlsib3JpZ2luYWxQYWNrYWdlQ29uZmlnID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvLXVwZGF0ZS1wYWNrYWdlcycpXG5cbndpbmRvdy5yZXN0b3JlRW52aXJvbm1lbnQgPSAtPlxuICBhdG9tLmNvbmZpZy5zZXQoJ2F1dG8tdXBkYXRlLXBhY2thZ2VzJywgb3JpZ2luYWxQYWNrYWdlQ29uZmlnKVxuIl19