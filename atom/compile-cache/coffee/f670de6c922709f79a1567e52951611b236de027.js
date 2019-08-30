(function() {
  var Pigments, deserializers, registry;

  registry = require('../../lib/color-expressions');

  Pigments = require('../../lib/pigments');

  deserializers = {
    Palette: 'deserializePalette',
    ColorSearch: 'deserializeColorSearch',
    ColorProject: 'deserializeColorProject',
    ColorProjectElement: 'deserializeColorProjectElement',
    VariablesCollection: 'deserializeVariablesCollection'
  };

  beforeEach(function() {
    var k, v;
    atom.config.set('pigments.markerType', 'background');
    atom.views.addViewProvider(Pigments.pigmentsViewProvider);
    for (k in deserializers) {
      v = deserializers[k];
      atom.deserializers.add({
        name: k,
        deserialize: Pigments[v]
      });
    }
    return registry.removeExpression('pigments:variables');
  });

  afterEach(function() {
    return registry.removeExpression('pigments:variables');
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9oZWxwZXJzL3NwZWMtaGVscGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSw2QkFBUjs7RUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLG9CQUFSOztFQUVYLGFBQUEsR0FDRTtJQUFBLE9BQUEsRUFBUyxvQkFBVDtJQUNBLFdBQUEsRUFBYSx3QkFEYjtJQUVBLFlBQUEsRUFBYyx5QkFGZDtJQUdBLG1CQUFBLEVBQXFCLGdDQUhyQjtJQUlBLG1CQUFBLEVBQXFCLGdDQUpyQjs7O0VBTUYsVUFBQSxDQUFXLFNBQUE7QUFDVCxRQUFBO0lBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHFCQUFoQixFQUF1QyxZQUF2QztJQUNBLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBWCxDQUEyQixRQUFRLENBQUMsb0JBQXBDO0FBRUEsU0FBQSxrQkFBQTs7TUFDRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQW5CLENBQXVCO1FBQUEsSUFBQSxFQUFNLENBQU47UUFBUyxXQUFBLEVBQWEsUUFBUyxDQUFBLENBQUEsQ0FBL0I7T0FBdkI7QUFERjtXQUdBLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixvQkFBMUI7RUFQUyxDQUFYOztFQVNBLFNBQUEsQ0FBVSxTQUFBO1dBQ1IsUUFBUSxDQUFDLGdCQUFULENBQTBCLG9CQUExQjtFQURRLENBQVY7QUFuQkEiLCJzb3VyY2VzQ29udGVudCI6WyJyZWdpc3RyeSA9IHJlcXVpcmUgJy4uLy4uL2xpYi9jb2xvci1leHByZXNzaW9ucydcblBpZ21lbnRzID0gcmVxdWlyZSAnLi4vLi4vbGliL3BpZ21lbnRzJ1xuXG5kZXNlcmlhbGl6ZXJzID1cbiAgUGFsZXR0ZTogJ2Rlc2VyaWFsaXplUGFsZXR0ZSdcbiAgQ29sb3JTZWFyY2g6ICdkZXNlcmlhbGl6ZUNvbG9yU2VhcmNoJ1xuICBDb2xvclByb2plY3Q6ICdkZXNlcmlhbGl6ZUNvbG9yUHJvamVjdCdcbiAgQ29sb3JQcm9qZWN0RWxlbWVudDogJ2Rlc2VyaWFsaXplQ29sb3JQcm9qZWN0RWxlbWVudCdcbiAgVmFyaWFibGVzQ29sbGVjdGlvbjogJ2Rlc2VyaWFsaXplVmFyaWFibGVzQ29sbGVjdGlvbidcblxuYmVmb3JlRWFjaCAtPlxuICBhdG9tLmNvbmZpZy5zZXQoJ3BpZ21lbnRzLm1hcmtlclR5cGUnLCAnYmFja2dyb3VuZCcpXG4gIGF0b20udmlld3MuYWRkVmlld1Byb3ZpZGVyKFBpZ21lbnRzLnBpZ21lbnRzVmlld1Byb3ZpZGVyKVxuXG4gIGZvciBrLHYgb2YgZGVzZXJpYWxpemVyc1xuICAgIGF0b20uZGVzZXJpYWxpemVycy5hZGQgbmFtZTogaywgZGVzZXJpYWxpemU6IFBpZ21lbnRzW3ZdXG5cbiAgcmVnaXN0cnkucmVtb3ZlRXhwcmVzc2lvbigncGlnbWVudHM6dmFyaWFibGVzJylcblxuYWZ0ZXJFYWNoIC0+XG4gIHJlZ2lzdHJ5LnJlbW92ZUV4cHJlc3Npb24oJ3BpZ21lbnRzOnZhcmlhYmxlcycpXG4iXX0=
