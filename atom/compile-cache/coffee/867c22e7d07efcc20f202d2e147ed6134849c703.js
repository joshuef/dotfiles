(function() {
  var VariablesCollection;

  VariablesCollection = require('../lib/variables-collection');

  describe('VariablesCollection', function() {
    var changeSpy, collection, createVar, ref;
    ref = [], collection = ref[0], changeSpy = ref[1];
    createVar = function(name, value, range, path, line) {
      return {
        name: name,
        value: value,
        range: range,
        path: path,
        line: line
      };
    };
    return describe('with an empty collection', function() {
      beforeEach(function() {
        collection = new VariablesCollection;
        changeSpy = jasmine.createSpy('did-change');
        return collection.onDidChange(changeSpy);
      });
      describe('::addMany', function() {
        beforeEach(function() {
          return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
        });
        it('stores them in the collection', function() {
          return expect(collection.length).toEqual(5);
        });
        it('detects that two of the variables are color variables', function() {
          return expect(collection.getColorVariables().length).toEqual(2);
        });
        it('dispatches a change event', function() {
          var arg;
          expect(changeSpy).toHaveBeenCalled();
          arg = changeSpy.mostRecentCall.args[0];
          expect(arg.created.length).toEqual(5);
          expect(arg.destroyed).toBeUndefined();
          return expect(arg.updated).toBeUndefined();
        });
        it('stores the names of the variables', function() {
          return expect(collection.variableNames.sort()).toEqual(['foo', 'bar', 'baz', 'bat', 'bab'].sort());
        });
        it('builds a dependencies map', function() {
          return expect(collection.dependencyGraph).toEqual({
            foo: ['baz'],
            bar: ['bat'],
            bat: ['bab']
          });
        });
        describe('appending an already existing variable', function() {
          beforeEach(function() {
            return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1)]);
          });
          it('leaves the collection untouched', function() {
            expect(collection.length).toEqual(5);
            return expect(collection.getColorVariables().length).toEqual(2);
          });
          return it('does not trigger an update event', function() {
            return expect(changeSpy.callCount).toEqual(1);
          });
        });
        return describe('appending an already existing variable with a different value', function() {
          describe('that has a different range', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '#aabbcc', [0, 14], '/path/to/foo.styl', 1)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('#aabbcc');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor('#aabbcc');
            });
            return it('emits a change event', function() {
              var arg;
              expect(changeSpy.callCount).toEqual(2);
              arg = changeSpy.mostRecentCall.args[0];
              expect(arg.created).toBeUndefined();
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(2);
            });
          });
          describe('that has a different range and a different line', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '#abc', [52, 64], '/path/to/foo.styl', 6)]);
            });
            it('appends the new variables', function() {
              expect(collection.length).toEqual(6);
              return expect(collection.getColorVariables().length).toEqual(3);
            });
            it('stores the two variables', function() {
              var variables;
              variables = collection.findAll({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              return expect(variables.length).toEqual(2);
            });
            return it('emits a change event', function() {
              var arg;
              expect(changeSpy.callCount).toEqual(2);
              arg = changeSpy.mostRecentCall.args[0];
              expect(arg.created.length).toEqual(1);
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(1);
            });
          });
          describe('that is still a color', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '#abc', [0, 10], '/path/to/foo.styl', 1)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('#abc');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor('#abc');
            });
            return it('emits a change event', function() {
              var arg;
              expect(changeSpy.callCount).toEqual(2);
              arg = changeSpy.mostRecentCall.args[0];
              expect(arg.created).toBeUndefined();
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(2);
            });
          });
          describe('that is no longer a color', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '20px', [0, 10], '/path/to/foo.styl', 1)]);
            });
            it('leaves the collection variables untouched', function() {
              return expect(collection.length).toEqual(5);
            });
            it('affects the colors variables within the collection', function() {
              return expect(collection.getColorVariables().length).toEqual(0);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('20px');
              return expect(variable.isColor).toBeFalsy();
            });
            it('updates the variables depending on the changed variable', function() {
              var variable;
              variable = collection.find({
                name: 'baz',
                path: '/path/to/foo.styl'
              });
              return expect(variable.isColor).toBeFalsy();
            });
            return it('emits a change event', function() {
              var arg;
              arg = changeSpy.mostRecentCall.args[0];
              expect(changeSpy.callCount).toEqual(2);
              expect(arg.created).toBeUndefined();
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(2);
            });
          });
          describe('that breaks a dependency', function() {
            beforeEach(function() {
              return collection.addMany([createVar('baz', '#abc', [22, 30], '/path/to/foo.styl', 3)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'baz',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('#abc');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor('#abc');
            });
            return it('updates the dependencies graph', function() {
              return expect(collection.dependencyGraph).toEqual({
                bar: ['bat'],
                bat: ['bab']
              });
            });
          });
          return describe('that adds a dependency', function() {
            beforeEach(function() {
              return collection.addMany([createVar('baz', 'transparentize(foo, bar)', [22, 30], '/path/to/foo.styl', 3)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'baz',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('transparentize(foo, bar)');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor(255, 255, 255, 0.5);
            });
            return it('updates the dependencies graph', function() {
              return expect(collection.dependencyGraph).toEqual({
                foo: ['baz'],
                bar: ['bat', 'baz'],
                bat: ['bab']
              });
            });
          });
        });
      });
      describe('::removeMany', function() {
        beforeEach(function() {
          return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
        });
        describe('with variables that were not colors', function() {
          beforeEach(function() {
            return collection.removeMany([createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
          });
          it('removes the variables from the collection', function() {
            return expect(collection.length).toEqual(3);
          });
          it('dispatches a change event', function() {
            var arg;
            expect(changeSpy).toHaveBeenCalled();
            arg = changeSpy.mostRecentCall.args[0];
            expect(arg.created).toBeUndefined();
            expect(arg.destroyed.length).toEqual(2);
            return expect(arg.updated).toBeUndefined();
          });
          it('stores the names of the variables', function() {
            return expect(collection.variableNames.sort()).toEqual(['foo', 'bar', 'baz'].sort());
          });
          it('updates the variables per path map', function() {
            return expect(collection.variablesByPath['/path/to/foo.styl'].length).toEqual(3);
          });
          return it('updates the dependencies map', function() {
            return expect(collection.dependencyGraph).toEqual({
              foo: ['baz']
            });
          });
        });
        return describe('with variables that were referenced by a color variable', function() {
          beforeEach(function() {
            return collection.removeMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1)]);
          });
          it('removes the variables from the collection', function() {
            expect(collection.length).toEqual(4);
            return expect(collection.getColorVariables().length).toEqual(0);
          });
          it('dispatches a change event', function() {
            var arg;
            expect(changeSpy).toHaveBeenCalled();
            arg = changeSpy.mostRecentCall.args[0];
            expect(arg.created).toBeUndefined();
            expect(arg.destroyed.length).toEqual(1);
            return expect(arg.updated.length).toEqual(1);
          });
          it('stores the names of the variables', function() {
            return expect(collection.variableNames.sort()).toEqual(['bar', 'baz', 'bat', 'bab'].sort());
          });
          it('updates the variables per path map', function() {
            return expect(collection.variablesByPath['/path/to/foo.styl'].length).toEqual(4);
          });
          return it('updates the dependencies map', function() {
            return expect(collection.dependencyGraph).toEqual({
              bar: ['bat'],
              bat: ['bab']
            });
          });
        });
      });
      describe('::updatePathCollection', function() {
        beforeEach(function() {
          return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
        });
        describe('when a new variable is added', function() {
          beforeEach(function() {
            return collection.updatePathCollection('/path/to/foo.styl', [createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5), createVar('baa', '#f00', [52, 60], '/path/to/foo.styl', 6)]);
          });
          return it('detects the addition and leave the rest of the collection unchanged', function() {
            expect(collection.length).toEqual(6);
            expect(collection.getColorVariables().length).toEqual(3);
            expect(changeSpy.mostRecentCall.args[0].created.length).toEqual(1);
            expect(changeSpy.mostRecentCall.args[0].destroyed).toBeUndefined();
            return expect(changeSpy.mostRecentCall.args[0].updated).toBeUndefined();
          });
        });
        describe('when a variable is removed', function() {
          beforeEach(function() {
            return collection.updatePathCollection('/path/to/foo.styl', [createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4)]);
          });
          return it('removes the variable that is not present in the new array', function() {
            expect(collection.length).toEqual(4);
            expect(collection.getColorVariables().length).toEqual(2);
            expect(changeSpy.mostRecentCall.args[0].destroyed.length).toEqual(1);
            expect(changeSpy.mostRecentCall.args[0].created).toBeUndefined();
            return expect(changeSpy.mostRecentCall.args[0].updated).toBeUndefined();
          });
        });
        return describe('when a new variable is changed', function() {
          beforeEach(function() {
            return collection.updatePathCollection('/path/to/foo.styl', [createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', '#abc', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
          });
          return it('detects the update', function() {
            expect(collection.length).toEqual(5);
            expect(collection.getColorVariables().length).toEqual(4);
            expect(changeSpy.mostRecentCall.args[0].updated.length).toEqual(2);
            expect(changeSpy.mostRecentCall.args[0].destroyed).toBeUndefined();
            return expect(changeSpy.mostRecentCall.args[0].created).toBeUndefined();
          });
        });
      });
      describe('::serialize', function() {
        describe('with an empty collection', function() {
          return it('returns an empty serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: []
            });
          });
        });
        describe('with a collection that contains a non-color variable', function() {
          beforeEach(function() {
            return collection.add(createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2));
          });
          return it('returns the serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: [
                {
                  name: 'bar',
                  value: '0.5',
                  range: [12, 20],
                  path: '/path/to/foo.styl',
                  line: 2
                }
              ]
            });
          });
        });
        describe('with a collection that contains a color variable', function() {
          beforeEach(function() {
            return collection.add(createVar('bar', '#abc', [12, 20], '/path/to/foo.styl', 2));
          });
          return it('returns the serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: [
                {
                  name: 'bar',
                  value: '#abc',
                  range: [12, 20],
                  path: '/path/to/foo.styl',
                  line: 2,
                  isColor: true,
                  color: [170, 187, 204, 1],
                  variables: []
                }
              ]
            });
          });
        });
        return describe('with a collection that contains color variables with references', function() {
          beforeEach(function() {
            collection.add(createVar('foo', '#abc', [0, 10], '/path/to/foo.styl', 1));
            return collection.add(createVar('bar', 'foo', [12, 20], '/path/to/foo.styl', 2));
          });
          return it('returns the serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: [
                {
                  name: 'foo',
                  value: '#abc',
                  range: [0, 10],
                  path: '/path/to/foo.styl',
                  line: 1,
                  isColor: true,
                  color: [170, 187, 204, 1],
                  variables: []
                }, {
                  name: 'bar',
                  value: 'foo',
                  range: [12, 20],
                  path: '/path/to/foo.styl',
                  line: 2,
                  isColor: true,
                  color: [170, 187, 204, 1],
                  variables: ['foo']
                }
              ]
            });
          });
        });
      });
      return describe('.deserialize', function() {
        beforeEach(function() {
          return collection = atom.deserializers.deserialize({
            deserializer: 'VariablesCollection',
            content: [
              {
                name: 'foo',
                value: '#abc',
                range: [0, 10],
                path: '/path/to/foo.styl',
                line: 1,
                isColor: true,
                color: [170, 187, 204, 1],
                variables: []
              }, {
                name: 'bar',
                value: 'foo',
                range: [12, 20],
                path: '/path/to/foo.styl',
                line: 2,
                isColor: true,
                color: [170, 187, 204, 1],
                variables: ['foo']
              }, {
                name: 'baz',
                value: '0.5',
                range: [22, 30],
                path: '/path/to/foo.styl',
                line: 3
              }
            ]
          });
        });
        it('restores the variables', function() {
          expect(collection.length).toEqual(3);
          return expect(collection.getColorVariables().length).toEqual(2);
        });
        return it('restores all the denormalized data in the collection', function() {
          expect(collection.variableNames).toEqual(['foo', 'bar', 'baz']);
          expect(Object.keys(collection.variablesByPath)).toEqual(['/path/to/foo.styl']);
          expect(collection.variablesByPath['/path/to/foo.styl'].length).toEqual(3);
          return expect(collection.dependencyGraph).toEqual({
            foo: ['bar']
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy92YXJpYWJsZXMtY29sbGVjdGlvbi1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLDZCQUFSOztFQUV0QixRQUFBLENBQVMscUJBQVQsRUFBZ0MsU0FBQTtBQUM5QixRQUFBO0lBQUEsTUFBMEIsRUFBMUIsRUFBQyxtQkFBRCxFQUFhO0lBRWIsU0FBQSxHQUFZLFNBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxLQUFkLEVBQXFCLElBQXJCLEVBQTJCLElBQTNCO2FBQ1Y7UUFBQyxNQUFBLElBQUQ7UUFBTyxPQUFBLEtBQVA7UUFBYyxPQUFBLEtBQWQ7UUFBcUIsTUFBQSxJQUFyQjtRQUEyQixNQUFBLElBQTNCOztJQURVO1dBR1osUUFBQSxDQUFTLDBCQUFULEVBQXFDLFNBQUE7TUFDbkMsVUFBQSxDQUFXLFNBQUE7UUFDVCxVQUFBLEdBQWEsSUFBSTtRQUNqQixTQUFBLEdBQVksT0FBTyxDQUFDLFNBQVIsQ0FBa0IsWUFBbEI7ZUFDWixVQUFVLENBQUMsV0FBWCxDQUF1QixTQUF2QjtNQUhTLENBQVg7TUFhQSxRQUFBLENBQVMsV0FBVCxFQUFzQixTQUFBO1FBQ3BCLFVBQUEsQ0FBVyxTQUFBO2lCQUNULFVBQVUsQ0FBQyxPQUFYLENBQW1CLENBQ2pCLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLE1BQWpCLEVBQXlCLENBQUMsQ0FBRCxFQUFHLEVBQUgsQ0FBekIsRUFBaUMsbUJBQWpDLEVBQXNELENBQXRELENBRGlCLEVBRWpCLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLEtBQWpCLEVBQXdCLENBQUMsRUFBRCxFQUFJLEVBQUosQ0FBeEIsRUFBaUMsbUJBQWpDLEVBQXNELENBQXRELENBRmlCLEVBR2pCLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLEtBQWpCLEVB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QUF0QyxDQUE2QyxDQUFDLE9BQTlDLENBQXNELENBQXREO1FBRjJCLENBQTdCO2VBSUEsRUFBQSxDQUFHLHNEQUFILEVBQTJELFNBQUE7VUFDekQsTUFBQSxDQUFPLFVBQVUsQ0FBQyxhQUFsQixDQUFnQyxDQUFDLE9BQWpDLENBQXlDLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLENBQXpDO1VBQ0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyxJQUFQLENBQVksVUFBVSxDQUFDLGVBQXZCLENBQVAsQ0FBOEMsQ0FBQyxPQUEvQyxDQUF1RCxDQUFDLG1CQUFELENBQXZEO1VBQ0EsTUFBQSxDQUFPLFVBQVUsQ0FBQyxlQUFnQixDQUFBLG1CQUFBLENBQW9CLENBQUMsTUFBdkQsQ0FBOEQsQ0FBQyxPQUEvRCxDQUF1RSxDQUF2RTtpQkFDQSxNQUFBLENBQU8sVUFBVSxDQUFDLGVBQWxCLENBQWtDLENBQUMsT0FBbkMsQ0FBMkM7WUFDekMsR0FBQSxFQUFLLENBQUMsS0FBRCxDQURvQztXQUEzQztRQUp5RCxDQUEzRDtNQXZDdUIsQ0FBekI7SUE3Y21DLENBQXJDO0VBTjhCLENBQWhDO0FBRkEiLCJzb3VyY2VzQ29udGVudCI6WyJWYXJpYWJsZXNDb2xsZWN0aW9uID0gcmVxdWlyZSAnLi4vbGliL3ZhcmlhYmxlcy1jb2xsZWN0aW9uJ1xuXG5kZXNjcmliZSAnVmFyaWFibGVzQ29sbGVjdGlvbicsIC0+XG4gIFtjb2xsZWN0aW9uLCBjaGFuZ2VTcHldID0gW11cblxuICBjcmVhdGVWYXIgPSAobmFtZSwgdmFsdWUsIHJhbmdlLCBwYXRoLCBsaW5lKSAtPlxuICAgIHtuYW1lLCB2YWx1ZSwgcmFuZ2UsIHBhdGgsIGxpbmV9XG5cbiAgZGVzY3JpYmUgJ3dpdGggYW4gZW1wdHkgY29sbGVjdGlvbicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgY29sbGVjdGlvbiA9IG5ldyBWYXJpYWJsZXNDb2xsZWN0aW9uXG4gICAgICBjaGFuZ2VTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLWNoYW5nZScpXG4gICAgICBjb2xsZWN0aW9uLm9uRGlkQ2hhbmdlKGNoYW5nZVNweSlcblxuICAgICMjICAgICAgICMjIyAgICAjIyMjIyMjIyAgIyMjIyMjIyNcbiAgICAjIyAgICAgICMjICMjICAgIyMgICAgICMjICMjICAgICAjI1xuICAgICMjICAgICAjIyAgICMjICAjIyAgICAgIyMgIyMgICAgICMjXG4gICAgIyMgICAgIyMgICAgICMjICMjICAgICAjIyAjIyAgICAgIyNcbiAgICAjIyAgICAjIyMjIyMjIyMgIyMgICAgICMjICMjICAgICAjI1xuICAgICMjICAgICMjICAgICAjIyAjIyAgICAgIyMgIyMgICAgICMjXG4gICAgIyMgICAgIyMgICAgICMjICMjIyMjIyMjICAjIyMjIyMjI1xuXG4gICAgZGVzY3JpYmUgJzo6YWRkTWFueScsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGNvbGxlY3Rpb24uYWRkTWFueShbXG4gICAgICAgICAgY3JlYXRlVmFyICdmb28nLCAnI2ZmZicsIFswLDEwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgMVxuICAgICAgICAgIGNyZWF0ZVZhciAnYmFyJywgJzAuNScsIFsxMiwyMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDJcbiAgICAgICAgICBjcmVhdGVWYXIgJ2JheicsICdmb28nLCBbMjIsMzBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAzXG4gICAgICAgICAgY3JlYXRlVmFyICdiYXQnLCAnYmFyJywgWzMyLDQwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgNFxuICAgICAgICAgIGNyZWF0ZVZhciAnYmFiJywgJ2JhdCcsIFs0Miw1MF0sICcvcGF0aC90by9mb28uc3R5bCcsIDVcbiAgICAgICAgXSlcblxuICAgICAgaXQgJ3N0b3JlcyB0aGVtIGluIHRoZSBjb2xsZWN0aW9uJywgLT5cbiAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24ubGVuZ3RoKS50b0VxdWFsKDUpXG5cbiAgICAgIGl0ICdkZXRlY3RzIHRoYXQgdHdvIG9mIHRoZSB2YXJpYWJsZXMgYXJlIGNvbG9yIHZhcmlhYmxlcycsIC0+XG4gICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgIGl0ICdkaXNwYXRjaGVzIGEgY2hhbmdlIGV2ZW50JywgLT5cbiAgICAgICAgZXhwZWN0KGNoYW5nZVNweSkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgICAgYXJnID0gY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF1cbiAgICAgICAgZXhwZWN0KGFyZy5jcmVhdGVkLmxlbmd0aCkudG9FcXVhbCg1KVxuICAgICAgICBleHBlY3QoYXJnLmRlc3Ryb3llZCkudG9CZVVuZGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChhcmcudXBkYXRlZCkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICAgIGl0ICdzdG9yZXMgdGhlIG5hbWVzIG9mIHRoZSB2YXJpYWJsZXMnLCAtPlxuICAgICAgICBleHBlY3QoY29sbGVjdGlvbi52YXJpYWJsZU5hbWVzLnNvcnQoKSkudG9FcXVhbChbJ2ZvbycsJ2JhcicsJ2JheicsJ2JhdCcsJ2JhYiddLnNvcnQoKSlcblxuICAgICAgaXQgJ2J1aWxkcyBhIGRlcGVuZGVuY2llcyBtYXAnLCAtPlxuICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5kZXBlbmRlbmN5R3JhcGgpLnRvRXF1YWwoe1xuICAgICAgICAgIGZvbzogWydiYXonXVxuICAgICAgICAgIGJhcjogWydiYXQnXVxuICAgICAgICAgIGJhdDogWydiYWInXVxuICAgICAgICB9KVxuXG4gICAgICBkZXNjcmliZSAnYXBwZW5kaW5nIGFuIGFscmVhZHkgZXhpc3RpbmcgdmFyaWFibGUnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgY29sbGVjdGlvbi5hZGRNYW55KFtcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnZm9vJywgJyNmZmYnLCBbMCwxMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDFcbiAgICAgICAgICBdKVxuXG4gICAgICAgIGl0ICdsZWF2ZXMgdGhlIGNvbGxlY3Rpb24gdW50b3VjaGVkJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5sZW5ndGgpLnRvRXF1YWwoNSlcbiAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5nZXRDb2xvclZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgyKVxuXG4gICAgICAgIGl0ICdkb2VzIG5vdCB0cmlnZ2VyIGFuIHVwZGF0ZSBldmVudCcsIC0+XG4gICAgICAgICAgZXhwZWN0KGNoYW5nZVNweS5jYWxsQ291bnQpLnRvRXF1YWwoMSlcblxuICAgICAgZGVzY3JpYmUgJ2FwcGVuZGluZyBhbiBhbHJlYWR5IGV4aXN0aW5nIHZhcmlhYmxlIHdpdGggYSBkaWZmZXJlbnQgdmFsdWUnLCAtPlxuICAgICAgICBkZXNjcmliZSAndGhhdCBoYXMgYSBkaWZmZXJlbnQgcmFuZ2UnLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYWRkTWFueShbXG4gICAgICAgICAgICAgIGNyZWF0ZVZhciAnZm9vJywgJyNhYWJiY2MnLCBbMCwxNF0sICcvcGF0aC90by9mb28uc3R5bCcsIDFcbiAgICAgICAgICAgIF0pXG5cbiAgICAgICAgICBpdCAnbGVhdmVzIHRoZSBjb2xsZWN0aW9uIHVudG91Y2hlZCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5sZW5ndGgpLnRvRXF1YWwoNSlcbiAgICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgICAgICBpdCAndXBkYXRlcyB0aGUgZXhpc3RpbmcgdmFyaWFibGUgdmFsdWUnLCAtPlxuICAgICAgICAgICAgdmFyaWFibGUgPSBjb2xsZWN0aW9uLmZpbmQoe1xuICAgICAgICAgICAgICBuYW1lOiAnZm9vJ1xuICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZXhwZWN0KHZhcmlhYmxlLnZhbHVlKS50b0VxdWFsKCcjYWFiYmNjJylcbiAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5pc0NvbG9yKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5jb2xvcikudG9CZUNvbG9yKCcjYWFiYmNjJylcblxuICAgICAgICAgIGl0ICdlbWl0cyBhIGNoYW5nZSBldmVudCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5LmNhbGxDb3VudCkudG9FcXVhbCgyKVxuXG4gICAgICAgICAgICBhcmcgPSBjaGFuZ2VTcHkubW9zdFJlY2VudENhbGwuYXJnc1swXVxuICAgICAgICAgICAgZXhwZWN0KGFyZy5jcmVhdGVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICAgIGV4cGVjdChhcmcuZGVzdHJveWVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICAgIGV4cGVjdChhcmcudXBkYXRlZC5sZW5ndGgpLnRvRXF1YWwoMilcblxuICAgICAgICBkZXNjcmliZSAndGhhdCBoYXMgYSBkaWZmZXJlbnQgcmFuZ2UgYW5kIGEgZGlmZmVyZW50IGxpbmUnLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYWRkTWFueShbXG4gICAgICAgICAgICAgIGNyZWF0ZVZhciAnZm9vJywgJyNhYmMnLCBbNTIsNjRdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCA2XG4gICAgICAgICAgICBdKVxuXG4gICAgICAgICAgaXQgJ2FwcGVuZHMgdGhlIG5ldyB2YXJpYWJsZXMnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24ubGVuZ3RoKS50b0VxdWFsKDYpXG4gICAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5nZXRDb2xvclZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgICAgICAgaXQgJ3N0b3JlcyB0aGUgdHdvIHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgICB2YXJpYWJsZXMgPSBjb2xsZWN0aW9uLmZpbmRBbGwoe1xuICAgICAgICAgICAgICBuYW1lOiAnZm9vJ1xuICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZXhwZWN0KHZhcmlhYmxlcy5sZW5ndGgpLnRvRXF1YWwoMilcblxuICAgICAgICAgIGl0ICdlbWl0cyBhIGNoYW5nZSBldmVudCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5LmNhbGxDb3VudCkudG9FcXVhbCgyKVxuXG4gICAgICAgICAgICBhcmcgPSBjaGFuZ2VTcHkubW9zdFJlY2VudENhbGwuYXJnc1swXVxuICAgICAgICAgICAgZXhwZWN0KGFyZy5jcmVhdGVkLmxlbmd0aCkudG9FcXVhbCgxKVxuICAgICAgICAgICAgZXhwZWN0KGFyZy5kZXN0cm95ZWQpLnRvQmVVbmRlZmluZWQoKVxuICAgICAgICAgICAgZXhwZWN0KGFyZy51cGRhdGVkLmxlbmd0aCkudG9FcXVhbCgxKVxuXG4gICAgICAgIGRlc2NyaWJlICd0aGF0IGlzIHN0aWxsIGEgY29sb3InLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYWRkTWFueShbXG4gICAgICAgICAgICAgIGNyZWF0ZVZhciAnZm9vJywgJyNhYmMnLCBbMCwxMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDFcbiAgICAgICAgICAgIF0pXG5cbiAgICAgICAgICBpdCAnbGVhdmVzIHRoZSBjb2xsZWN0aW9uIHVudG91Y2hlZCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5sZW5ndGgpLnRvRXF1YWwoNSlcbiAgICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgICAgICBpdCAndXBkYXRlcyB0aGUgZXhpc3RpbmcgdmFyaWFibGUgdmFsdWUnLCAtPlxuICAgICAgICAgICAgdmFyaWFibGUgPSBjb2xsZWN0aW9uLmZpbmQoe1xuICAgICAgICAgICAgICBuYW1lOiAnZm9vJ1xuICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZXhwZWN0KHZhcmlhYmxlLnZhbHVlKS50b0VxdWFsKCcjYWJjJylcbiAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5pc0NvbG9yKS50b0JlVHJ1dGh5KClcbiAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5jb2xvcikudG9CZUNvbG9yKCcjYWJjJylcblxuICAgICAgICAgIGl0ICdlbWl0cyBhIGNoYW5nZSBldmVudCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5LmNhbGxDb3VudCkudG9FcXVhbCgyKVxuXG4gICAgICAgICAgICBhcmcgPSBjaGFuZ2VTcHkubW9zdFJlY2VudENhbGwuYXJnc1swXVxuICAgICAgICAgICAgZXhwZWN0KGFyZy5jcmVhdGVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICAgIGV4cGVjdChhcmcuZGVzdHJveWVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICAgIGV4cGVjdChhcmcudXBkYXRlZC5sZW5ndGgpLnRvRXF1YWwoMilcblxuICAgICAgICBkZXNjcmliZSAndGhhdCBpcyBubyBsb25nZXIgYSBjb2xvcicsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgY29sbGVjdGlvbi5hZGRNYW55KFtcbiAgICAgICAgICAgICAgY3JlYXRlVmFyICdmb28nLCAnMjBweCcsIFswLDEwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgMVxuICAgICAgICAgICAgXSlcblxuICAgICAgICAgIGl0ICdsZWF2ZXMgdGhlIGNvbGxlY3Rpb24gdmFyaWFibGVzIHVudG91Y2hlZCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5sZW5ndGgpLnRvRXF1YWwoNSlcblxuICAgICAgICAgIGl0ICdhZmZlY3RzIHRoZSBjb2xvcnMgdmFyaWFibGVzIHdpdGhpbiB0aGUgY29sbGVjdGlvbicsIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5nZXRDb2xvclZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICAgICAgICAgaXQgJ3VwZGF0ZXMgdGhlIGV4aXN0aW5nIHZhcmlhYmxlIHZhbHVlJywgLT5cbiAgICAgICAgICAgIHZhcmlhYmxlID0gY29sbGVjdGlvbi5maW5kKHtcbiAgICAgICAgICAgICAgbmFtZTogJ2ZvbydcbiAgICAgICAgICAgICAgcGF0aDogJy9wYXRoL3RvL2Zvby5zdHlsJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS52YWx1ZSkudG9FcXVhbCgnMjBweCcpXG4gICAgICAgICAgICBleHBlY3QodmFyaWFibGUuaXNDb2xvcikudG9CZUZhbHN5KClcblxuICAgICAgICAgIGl0ICd1cGRhdGVzIHRoZSB2YXJpYWJsZXMgZGVwZW5kaW5nIG9uIHRoZSBjaGFuZ2VkIHZhcmlhYmxlJywgLT5cbiAgICAgICAgICAgIHZhcmlhYmxlID0gY29sbGVjdGlvbi5maW5kKHtcbiAgICAgICAgICAgICAgbmFtZTogJ2JheidcbiAgICAgICAgICAgICAgcGF0aDogJy9wYXRoL3RvL2Zvby5zdHlsJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS5pc0NvbG9yKS50b0JlRmFsc3koKVxuXG4gICAgICAgICAgaXQgJ2VtaXRzIGEgY2hhbmdlIGV2ZW50JywgLT5cbiAgICAgICAgICAgIGFyZyA9IGNoYW5nZVNweS5tb3N0UmVjZW50Q2FsbC5hcmdzWzBdXG4gICAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5LmNhbGxDb3VudCkudG9FcXVhbCgyKVxuXG4gICAgICAgICAgICBleHBlY3QoYXJnLmNyZWF0ZWQpLnRvQmVVbmRlZmluZWQoKVxuICAgICAgICAgICAgZXhwZWN0KGFyZy5kZXN0cm95ZWQpLnRvQmVVbmRlZmluZWQoKVxuICAgICAgICAgICAgZXhwZWN0KGFyZy51cGRhdGVkLmxlbmd0aCkudG9FcXVhbCgyKVxuXG4gICAgICAgIGRlc2NyaWJlICd0aGF0IGJyZWFrcyBhIGRlcGVuZGVuY3knLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYWRkTWFueShbXG4gICAgICAgICAgICAgIGNyZWF0ZVZhciAnYmF6JywgJyNhYmMnLCBbMjIsMzBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAzXG4gICAgICAgICAgICBdKVxuXG4gICAgICAgICAgaXQgJ2xlYXZlcyB0aGUgY29sbGVjdGlvbiB1bnRvdWNoZWQnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24ubGVuZ3RoKS50b0VxdWFsKDUpXG4gICAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5nZXRDb2xvclZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgyKVxuXG4gICAgICAgICAgaXQgJ3VwZGF0ZXMgdGhlIGV4aXN0aW5nIHZhcmlhYmxlIHZhbHVlJywgLT5cbiAgICAgICAgICAgIHZhcmlhYmxlID0gY29sbGVjdGlvbi5maW5kKHtcbiAgICAgICAgICAgICAgbmFtZTogJ2JheidcbiAgICAgICAgICAgICAgcGF0aDogJy9wYXRoL3RvL2Zvby5zdHlsJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGV4cGVjdCh2YXJpYWJsZS52YWx1ZSkudG9FcXVhbCgnI2FiYycpXG4gICAgICAgICAgICBleHBlY3QodmFyaWFibGUuaXNDb2xvcikudG9CZVRydXRoeSgpXG4gICAgICAgICAgICBleHBlY3QodmFyaWFibGUuY29sb3IpLnRvQmVDb2xvcignI2FiYycpXG5cbiAgICAgICAgICBpdCAndXBkYXRlcyB0aGUgZGVwZW5kZW5jaWVzIGdyYXBoJywgLT5cbiAgICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmRlcGVuZGVuY3lHcmFwaCkudG9FcXVhbCh7XG4gICAgICAgICAgICAgIGJhcjogWydiYXQnXVxuICAgICAgICAgICAgICBiYXQ6IFsnYmFiJ11cbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgZGVzY3JpYmUgJ3RoYXQgYWRkcyBhIGRlcGVuZGVuY3knLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYWRkTWFueShbXG4gICAgICAgICAgICAgIGNyZWF0ZVZhciAnYmF6JywgJ3RyYW5zcGFyZW50aXplKGZvbywgYmFyKScsIFsyMiwzMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDNcbiAgICAgICAgICAgIF0pXG5cbiAgICAgICAgICBpdCAnbGVhdmVzIHRoZSBjb2xsZWN0aW9uIHVudG91Y2hlZCcsIC0+XG4gICAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5sZW5ndGgpLnRvRXF1YWwoNSlcbiAgICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDIpXG5cbiAgICAgICAgICBpdCAndXBkYXRlcyB0aGUgZXhpc3RpbmcgdmFyaWFibGUgdmFsdWUnLCAtPlxuICAgICAgICAgICAgdmFyaWFibGUgPSBjb2xsZWN0aW9uLmZpbmQoe1xuICAgICAgICAgICAgICBuYW1lOiAnYmF6J1xuICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZXhwZWN0KHZhcmlhYmxlLnZhbHVlKS50b0VxdWFsKCd0cmFuc3BhcmVudGl6ZShmb28sIGJhciknKVxuICAgICAgICAgICAgZXhwZWN0KHZhcmlhYmxlLmlzQ29sb3IpLnRvQmVUcnV0aHkoKVxuICAgICAgICAgICAgZXhwZWN0KHZhcmlhYmxlLmNvbG9yKS50b0JlQ29sb3IoMjU1LDI1NSwyNTUsIDAuNSlcblxuICAgICAgICAgIGl0ICd1cGRhdGVzIHRoZSBkZXBlbmRlbmNpZXMgZ3JhcGgnLCAtPlxuICAgICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24uZGVwZW5kZW5jeUdyYXBoKS50b0VxdWFsKHtcbiAgICAgICAgICAgICAgZm9vOiBbJ2JheiddXG4gICAgICAgICAgICAgIGJhcjogWydiYXQnLCAnYmF6J11cbiAgICAgICAgICAgICAgYmF0OiBbJ2JhYiddXG4gICAgICAgICAgICB9KVxuXG4gICAgIyMgICAgIyMjIyMjIyMgICMjIyMjIyMjICMjICAgICAjIyAgIyMjIyMjIyAgIyMgICAgICMjICMjIyMjIyMjXG4gICAgIyMgICAgIyMgICAgICMjICMjICAgICAgICMjIyAgICMjIyAjIyAgICAgIyMgIyMgICAgICMjICMjXG4gICAgIyMgICAgIyMgICAgICMjICMjICAgICAgICMjIyMgIyMjIyAjIyAgICAgIyMgIyMgICAgICMjICMjXG4gICAgIyMgICAgIyMjIyMjIyMgICMjIyMjIyAgICMjICMjIyAjIyAjIyAgICAgIyMgIyMgICAgICMjICMjIyMjI1xuICAgICMjICAgICMjICAgIyMgICAjIyAgICAgICAjIyAgICAgIyMgIyMgICAgICMjICAjIyAgICMjICAjI1xuICAgICMjICAgICMjICAgICMjICAjIyAgICAgICAjIyAgICAgIyMgIyMgICAgICMjICAgIyMgIyMgICAjI1xuICAgICMjICAgICMjICAgICAjIyAjIyMjIyMjIyAjIyAgICAgIyMgICMjIyMjIyMgICAgICMjIyAgICAjIyMjIyMjI1xuXG4gICAgZGVzY3JpYmUgJzo6cmVtb3ZlTWFueScsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGNvbGxlY3Rpb24uYWRkTWFueShbXG4gICAgICAgICAgY3JlYXRlVmFyICdmb28nLCAnI2ZmZicsIFswLDEwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgMVxuICAgICAgICAgIGNyZWF0ZVZhciAnYmFyJywgJzAuNScsIFsxMiwyMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDJcbiAgICAgICAgICBjcmVhdGVWYXIgJ2JheicsICdmb28nLCBbMjIsMzBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAzXG4gICAgICAgICAgY3JlYXRlVmFyICdiYXQnLCAnYmFyJywgWzMyLDQwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgNFxuICAgICAgICAgIGNyZWF0ZVZhciAnYmFiJywgJ2JhdCcsIFs0Miw1MF0sICcvcGF0aC90by9mb28uc3R5bCcsIDVcbiAgICAgICAgXSlcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggdmFyaWFibGVzIHRoYXQgd2VyZSBub3QgY29sb3JzJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGNvbGxlY3Rpb24ucmVtb3ZlTWFueShbXG4gICAgICAgICAgICBjcmVhdGVWYXIgJ2JhdCcsICdiYXInLCBbMzIsNDBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCA0XG4gICAgICAgICAgICBjcmVhdGVWYXIgJ2JhYicsICdiYXQnLCBbNDIsNTBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCA1XG4gICAgICAgICAgXSlcblxuICAgICAgICBpdCAncmVtb3ZlcyB0aGUgdmFyaWFibGVzIGZyb20gdGhlIGNvbGxlY3Rpb24nLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgICAgIGl0ICdkaXNwYXRjaGVzIGEgY2hhbmdlIGV2ZW50JywgLT5cbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5KS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgICAgIGFyZyA9IGNoYW5nZVNweS5tb3N0UmVjZW50Q2FsbC5hcmdzWzBdXG4gICAgICAgICAgZXhwZWN0KGFyZy5jcmVhdGVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoYXJnLmRlc3Ryb3llZC5sZW5ndGgpLnRvRXF1YWwoMilcbiAgICAgICAgICBleHBlY3QoYXJnLnVwZGF0ZWQpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgICAgIGl0ICdzdG9yZXMgdGhlIG5hbWVzIG9mIHRoZSB2YXJpYWJsZXMnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLnZhcmlhYmxlTmFtZXMuc29ydCgpKS50b0VxdWFsKFsnZm9vJywnYmFyJywnYmF6J10uc29ydCgpKVxuXG4gICAgICAgIGl0ICd1cGRhdGVzIHRoZSB2YXJpYWJsZXMgcGVyIHBhdGggbWFwJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi52YXJpYWJsZXNCeVBhdGhbJy9wYXRoL3RvL2Zvby5zdHlsJ10ubGVuZ3RoKS50b0VxdWFsKDMpXG5cbiAgICAgICAgaXQgJ3VwZGF0ZXMgdGhlIGRlcGVuZGVuY2llcyBtYXAnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmRlcGVuZGVuY3lHcmFwaCkudG9FcXVhbCh7XG4gICAgICAgICAgICBmb286IFsnYmF6J11cbiAgICAgICAgICB9KVxuXG4gICAgICBkZXNjcmliZSAnd2l0aCB2YXJpYWJsZXMgdGhhdCB3ZXJlIHJlZmVyZW5jZWQgYnkgYSBjb2xvciB2YXJpYWJsZScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBjb2xsZWN0aW9uLnJlbW92ZU1hbnkoW1xuICAgICAgICAgICAgY3JlYXRlVmFyICdmb28nLCAnI2ZmZicsIFswLDEwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgMVxuICAgICAgICAgIF0pXG5cbiAgICAgICAgaXQgJ3JlbW92ZXMgdGhlIHZhcmlhYmxlcyBmcm9tIHRoZSBjb2xsZWN0aW9uJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5sZW5ndGgpLnRvRXF1YWwoNClcbiAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5nZXRDb2xvclZhcmlhYmxlcygpLmxlbmd0aCkudG9FcXVhbCgwKVxuXG4gICAgICAgIGl0ICdkaXNwYXRjaGVzIGEgY2hhbmdlIGV2ZW50JywgLT5cbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5KS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgICAgICAgIGFyZyA9IGNoYW5nZVNweS5tb3N0UmVjZW50Q2FsbC5hcmdzWzBdXG4gICAgICAgICAgZXhwZWN0KGFyZy5jcmVhdGVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoYXJnLmRlc3Ryb3llZC5sZW5ndGgpLnRvRXF1YWwoMSlcbiAgICAgICAgICBleHBlY3QoYXJnLnVwZGF0ZWQubGVuZ3RoKS50b0VxdWFsKDEpXG5cbiAgICAgICAgaXQgJ3N0b3JlcyB0aGUgbmFtZXMgb2YgdGhlIHZhcmlhYmxlcycsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24udmFyaWFibGVOYW1lcy5zb3J0KCkpLnRvRXF1YWwoWydiYXInLCdiYXonLCdiYXQnLCdiYWInXS5zb3J0KCkpXG5cbiAgICAgICAgaXQgJ3VwZGF0ZXMgdGhlIHZhcmlhYmxlcyBwZXIgcGF0aCBtYXAnLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLnZhcmlhYmxlc0J5UGF0aFsnL3BhdGgvdG8vZm9vLnN0eWwnXS5sZW5ndGgpLnRvRXF1YWwoNClcblxuICAgICAgICBpdCAndXBkYXRlcyB0aGUgZGVwZW5kZW5jaWVzIG1hcCcsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24uZGVwZW5kZW5jeUdyYXBoKS50b0VxdWFsKHtcbiAgICAgICAgICAgIGJhcjogWydiYXQnXVxuICAgICAgICAgICAgYmF0OiBbJ2JhYiddXG4gICAgICAgICAgfSlcblxuICAgICMjICAgICMjICAgICAjIyAjIyMjIyMjIyAgIyMjIyMjIyMgICAgICMjIyAgICAjIyMjIyMjIyAjIyMjIyMjI1xuICAgICMjICAgICMjICAgICAjIyAjIyAgICAgIyMgIyMgICAgICMjICAgIyMgIyMgICAgICAjIyAgICAjI1xuICAgICMjICAgICMjICAgICAjIyAjIyAgICAgIyMgIyMgICAgICMjICAjIyAgICMjICAgICAjIyAgICAjI1xuICAgICMjICAgICMjICAgICAjIyAjIyMjIyMjIyAgIyMgICAgICMjICMjICAgICAjIyAgICAjIyAgICAjIyMjIyNcbiAgICAjIyAgICAjIyAgICAgIyMgIyMgICAgICAgICMjICAgICAjIyAjIyMjIyMjIyMgICAgIyMgICAgIyNcbiAgICAjIyAgICAjIyAgICAgIyMgIyMgICAgICAgICMjICAgICAjIyAjIyAgICAgIyMgICAgIyMgICAgIyNcbiAgICAjIyAgICAgIyMjIyMjIyAgIyMgICAgICAgICMjIyMjIyMjICAjIyAgICAgIyMgICAgIyMgICAgIyMjIyMjIyNcblxuICAgIGRlc2NyaWJlICc6OnVwZGF0ZVBhdGhDb2xsZWN0aW9uJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgY29sbGVjdGlvbi5hZGRNYW55KFtcbiAgICAgICAgICBjcmVhdGVWYXIgJ2ZvbycsICcjZmZmJywgWzAsMTBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAxXG4gICAgICAgICAgY3JlYXRlVmFyICdiYXInLCAnMC41JywgWzEyLDIwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgMlxuICAgICAgICAgIGNyZWF0ZVZhciAnYmF6JywgJ2ZvbycsIFsyMiwzMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDNcbiAgICAgICAgICBjcmVhdGVWYXIgJ2JhdCcsICdiYXInLCBbMzIsNDBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCA0XG4gICAgICAgICAgY3JlYXRlVmFyICdiYWInLCAnYmF0JywgWzQyLDUwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgNVxuICAgICAgICBdKVxuXG4gICAgICBkZXNjcmliZSAnd2hlbiBhIG5ldyB2YXJpYWJsZSBpcyBhZGRlZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBjb2xsZWN0aW9uLnVwZGF0ZVBhdGhDb2xsZWN0aW9uKCcvcGF0aC90by9mb28uc3R5bCcgLFtcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnZm9vJywgJyNmZmYnLCBbMCwxMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDFcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmFyJywgJzAuNScsIFsxMiwyMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDJcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmF6JywgJ2ZvbycsIFsyMiwzMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDNcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmF0JywgJ2JhcicsIFszMiw0MF0sICcvcGF0aC90by9mb28uc3R5bCcsIDRcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmFiJywgJ2JhdCcsIFs0Miw1MF0sICcvcGF0aC90by9mb28uc3R5bCcsIDVcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmFhJywgJyNmMDAnLCBbNTIsNjBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCA2XG4gICAgICAgICAgXSlcblxuICAgICAgICBpdCAnZGV0ZWN0cyB0aGUgYWRkaXRpb24gYW5kIGxlYXZlIHRoZSByZXN0IG9mIHRoZSBjb2xsZWN0aW9uIHVuY2hhbmdlZCcsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24ubGVuZ3RoKS50b0VxdWFsKDYpXG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24uZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0uY3JlYXRlZC5sZW5ndGgpLnRvRXF1YWwoMSlcbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0uZGVzdHJveWVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0udXBkYXRlZCkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIGEgdmFyaWFibGUgaXMgcmVtb3ZlZCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBjb2xsZWN0aW9uLnVwZGF0ZVBhdGhDb2xsZWN0aW9uKCcvcGF0aC90by9mb28uc3R5bCcgLFtcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnZm9vJywgJyNmZmYnLCBbMCwxMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDFcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmFyJywgJzAuNScsIFsxMiwyMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDJcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmF6JywgJ2ZvbycsIFsyMiwzMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDNcbiAgICAgICAgICAgIGNyZWF0ZVZhciAnYmF0JywgJ2JhcicsIFszMiw0MF0sICcvcGF0aC90by9mb28uc3R5bCcsIDRcbiAgICAgICAgICBdKVxuXG4gICAgICAgIGl0ICdyZW1vdmVzIHRoZSB2YXJpYWJsZSB0aGF0IGlzIG5vdCBwcmVzZW50IGluIHRoZSBuZXcgYXJyYXknLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmxlbmd0aCkudG9FcXVhbCg0KVxuICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLmdldENvbG9yVmFyaWFibGVzKCkubGVuZ3RoKS50b0VxdWFsKDIpXG4gICAgICAgICAgZXhwZWN0KGNoYW5nZVNweS5tb3N0UmVjZW50Q2FsbC5hcmdzWzBdLmRlc3Ryb3llZC5sZW5ndGgpLnRvRXF1YWwoMSlcbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0uY3JlYXRlZCkudG9CZVVuZGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KGNoYW5nZVNweS5tb3N0UmVjZW50Q2FsbC5hcmdzWzBdLnVwZGF0ZWQpLnRvQmVVbmRlZmluZWQoKVxuXG5cbiAgICAgIGRlc2NyaWJlICd3aGVuIGEgbmV3IHZhcmlhYmxlIGlzIGNoYW5nZWQnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgY29sbGVjdGlvbi51cGRhdGVQYXRoQ29sbGVjdGlvbignL3BhdGgvdG8vZm9vLnN0eWwnICxbXG4gICAgICAgICAgICBjcmVhdGVWYXIgJ2ZvbycsICcjZmZmJywgWzAsMTBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAxXG4gICAgICAgICAgICBjcmVhdGVWYXIgJ2JhcicsICcwLjUnLCBbMTIsMjBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAyXG4gICAgICAgICAgICBjcmVhdGVWYXIgJ2JheicsICdmb28nLCBbMjIsMzBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAzXG4gICAgICAgICAgICBjcmVhdGVWYXIgJ2JhdCcsICcjYWJjJywgWzMyLDQwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgNFxuICAgICAgICAgICAgY3JlYXRlVmFyICdiYWInLCAnYmF0JywgWzQyLDUwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgNVxuICAgICAgICAgIF0pXG5cbiAgICAgICAgaXQgJ2RldGVjdHMgdGhlIHVwZGF0ZScsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24ubGVuZ3RoKS50b0VxdWFsKDUpXG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24uZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoNClcbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0udXBkYXRlZC5sZW5ndGgpLnRvRXF1YWwoMilcbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0uZGVzdHJveWVkKS50b0JlVW5kZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoY2hhbmdlU3B5Lm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0uY3JlYXRlZCkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICAjIyAgICAjIyMjIyMjIyAgIyMjIyMjIyMgICMjIyMjIyAgIyMjIyMjIyMgICMjIyMjIyMgICMjIyMjIyMjICAjIyMjIyMjI1xuICAgICMjICAgICMjICAgICAjIyAjIyAgICAgICAjIyAgICAjIyAgICAjIyAgICAjIyAgICAgIyMgIyMgICAgICMjICMjXG4gICAgIyMgICAgIyMgICAgICMjICMjICAgICAgICMjICAgICAgICAgICMjICAgICMjICAgICAjIyAjIyAgICAgIyMgIyNcbiAgICAjIyAgICAjIyMjIyMjIyAgIyMjIyMjICAgICMjIyMjIyAgICAgIyMgICAgIyMgICAgICMjICMjIyMjIyMjICAjIyMjIyNcbiAgICAjIyAgICAjIyAgICMjICAgIyMgICAgICAgICAgICAgIyMgICAgIyMgICAgIyMgICAgICMjICMjICAgIyMgICAjI1xuICAgICMjICAgICMjICAgICMjICAjIyAgICAgICAjIyAgICAjIyAgICAjIyAgICAjIyAgICAgIyMgIyMgICAgIyMgICMjXG4gICAgIyMgICAgIyMgICAgICMjICMjIyMjIyMjICAjIyMjIyMgICAgICMjICAgICAjIyMjIyMjICAjIyAgICAgIyMgIyMjIyMjIyNcblxuICAgIGRlc2NyaWJlICc6OnNlcmlhbGl6ZScsIC0+XG4gICAgICBkZXNjcmliZSAnd2l0aCBhbiBlbXB0eSBjb2xsZWN0aW9uJywgLT5cbiAgICAgICAgaXQgJ3JldHVybnMgYW4gZW1wdHkgc2VyaWFsaXplZCBjb2xsZWN0aW9uJywgLT5cbiAgICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5zZXJpYWxpemUoKSkudG9FcXVhbCh7XG4gICAgICAgICAgICBkZXNlcmlhbGl6ZXI6ICdWYXJpYWJsZXNDb2xsZWN0aW9uJ1xuICAgICAgICAgICAgY29udGVudDogW11cbiAgICAgICAgICB9KVxuXG4gICAgICBkZXNjcmliZSAnd2l0aCBhIGNvbGxlY3Rpb24gdGhhdCBjb250YWlucyBhIG5vbi1jb2xvciB2YXJpYWJsZScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBjb2xsZWN0aW9uLmFkZCBjcmVhdGVWYXIgJ2JhcicsICcwLjUnLCBbMTIsMjBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAyXG5cbiAgICAgICAgaXQgJ3JldHVybnMgdGhlIHNlcmlhbGl6ZWQgY29sbGVjdGlvbicsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24uc2VyaWFsaXplKCkpLnRvRXF1YWwoe1xuICAgICAgICAgICAgZGVzZXJpYWxpemVyOiAnVmFyaWFibGVzQ29sbGVjdGlvbidcbiAgICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdiYXInXG4gICAgICAgICAgICAgICAgdmFsdWU6ICcwLjUnXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFsxMiwyMF1cbiAgICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICAgICAgbGluZTogMlxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfSlcblxuICAgICAgZGVzY3JpYmUgJ3dpdGggYSBjb2xsZWN0aW9uIHRoYXQgY29udGFpbnMgYSBjb2xvciB2YXJpYWJsZScsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBjb2xsZWN0aW9uLmFkZCBjcmVhdGVWYXIgJ2JhcicsICcjYWJjJywgWzEyLDIwXSwgJy9wYXRoL3RvL2Zvby5zdHlsJywgMlxuXG4gICAgICAgIGl0ICdyZXR1cm5zIHRoZSBzZXJpYWxpemVkIGNvbGxlY3Rpb24nLCAtPlxuICAgICAgICAgIGV4cGVjdChjb2xsZWN0aW9uLnNlcmlhbGl6ZSgpKS50b0VxdWFsKHtcbiAgICAgICAgICAgIGRlc2VyaWFsaXplcjogJ1ZhcmlhYmxlc0NvbGxlY3Rpb24nXG4gICAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnYmFyJ1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnI2FiYydcbiAgICAgICAgICAgICAgICByYW5nZTogWzEyLDIwXVxuICAgICAgICAgICAgICAgIHBhdGg6ICcvcGF0aC90by9mb28uc3R5bCdcbiAgICAgICAgICAgICAgICBsaW5lOiAyXG4gICAgICAgICAgICAgICAgaXNDb2xvcjogdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbG9yOiBbMTcwLCAxODcsIDIwNCwgMV1cbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IFtdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9KVxuXG4gICAgICBkZXNjcmliZSAnd2l0aCBhIGNvbGxlY3Rpb24gdGhhdCBjb250YWlucyBjb2xvciB2YXJpYWJsZXMgd2l0aCByZWZlcmVuY2VzJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGNvbGxlY3Rpb24uYWRkIGNyZWF0ZVZhciAnZm9vJywgJyNhYmMnLCBbMCwxMF0sICcvcGF0aC90by9mb28uc3R5bCcsIDFcbiAgICAgICAgICBjb2xsZWN0aW9uLmFkZCBjcmVhdGVWYXIgJ2JhcicsICdmb28nLCBbMTIsMjBdLCAnL3BhdGgvdG8vZm9vLnN0eWwnLCAyXG5cbiAgICAgICAgaXQgJ3JldHVybnMgdGhlIHNlcmlhbGl6ZWQgY29sbGVjdGlvbicsIC0+XG4gICAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24uc2VyaWFsaXplKCkpLnRvRXF1YWwoe1xuICAgICAgICAgICAgZGVzZXJpYWxpemVyOiAnVmFyaWFibGVzQ29sbGVjdGlvbidcbiAgICAgICAgICAgIGNvbnRlbnQ6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdmb28nXG4gICAgICAgICAgICAgICAgdmFsdWU6ICcjYWJjJ1xuICAgICAgICAgICAgICAgIHJhbmdlOiBbMCwxMF1cbiAgICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICAgICAgbGluZTogMVxuICAgICAgICAgICAgICAgIGlzQ29sb3I6IHRydWVcbiAgICAgICAgICAgICAgICBjb2xvcjogWzE3MCwgMTg3LCAyMDQsIDFdXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBbXVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhcidcbiAgICAgICAgICAgICAgICB2YWx1ZTogJ2ZvbydcbiAgICAgICAgICAgICAgICByYW5nZTogWzEyLDIwXVxuICAgICAgICAgICAgICAgIHBhdGg6ICcvcGF0aC90by9mb28uc3R5bCdcbiAgICAgICAgICAgICAgICBsaW5lOiAyXG4gICAgICAgICAgICAgICAgaXNDb2xvcjogdHJ1ZVxuICAgICAgICAgICAgICAgIGNvbG9yOiBbMTcwLCAxODcsIDIwNCwgMV1cbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IFsnZm9vJ11cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0pXG5cbiAgICBkZXNjcmliZSAnLmRlc2VyaWFsaXplJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgY29sbGVjdGlvbiA9IGF0b20uZGVzZXJpYWxpemVycy5kZXNlcmlhbGl6ZSh7XG4gICAgICAgICAgZGVzZXJpYWxpemVyOiAnVmFyaWFibGVzQ29sbGVjdGlvbidcbiAgICAgICAgICBjb250ZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG5hbWU6ICdmb28nXG4gICAgICAgICAgICAgIHZhbHVlOiAnI2FiYydcbiAgICAgICAgICAgICAgcmFuZ2U6IFswLDEwXVxuICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICAgIGxpbmU6IDFcbiAgICAgICAgICAgICAgaXNDb2xvcjogdHJ1ZVxuICAgICAgICAgICAgICBjb2xvcjogWzE3MCwgMTg3LCAyMDQsIDFdXG4gICAgICAgICAgICAgIHZhcmlhYmxlczogW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG5hbWU6ICdiYXInXG4gICAgICAgICAgICAgIHZhbHVlOiAnZm9vJ1xuICAgICAgICAgICAgICByYW5nZTogWzEyLDIwXVxuICAgICAgICAgICAgICBwYXRoOiAnL3BhdGgvdG8vZm9vLnN0eWwnXG4gICAgICAgICAgICAgIGxpbmU6IDJcbiAgICAgICAgICAgICAgaXNDb2xvcjogdHJ1ZVxuICAgICAgICAgICAgICBjb2xvcjogWzE3MCwgMTg3LCAyMDQsIDFdXG4gICAgICAgICAgICAgIHZhcmlhYmxlczogWydmb28nXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbmFtZTogJ2JheidcbiAgICAgICAgICAgICAgdmFsdWU6ICcwLjUnXG4gICAgICAgICAgICAgIHJhbmdlOiBbMjIsMzBdXG4gICAgICAgICAgICAgIHBhdGg6ICcvcGF0aC90by9mb28uc3R5bCdcbiAgICAgICAgICAgICAgbGluZTogM1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSlcblxuICAgICAgaXQgJ3Jlc3RvcmVzIHRoZSB2YXJpYWJsZXMnLCAtPlxuICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5sZW5ndGgpLnRvRXF1YWwoMylcbiAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24uZ2V0Q29sb3JWYXJpYWJsZXMoKS5sZW5ndGgpLnRvRXF1YWwoMilcblxuICAgICAgaXQgJ3Jlc3RvcmVzIGFsbCB0aGUgZGVub3JtYWxpemVkIGRhdGEgaW4gdGhlIGNvbGxlY3Rpb24nLCAtPlxuICAgICAgICBleHBlY3QoY29sbGVjdGlvbi52YXJpYWJsZU5hbWVzKS50b0VxdWFsKFsnZm9vJywgJ2JhcicsICdiYXonXSlcbiAgICAgICAgZXhwZWN0KE9iamVjdC5rZXlzIGNvbGxlY3Rpb24udmFyaWFibGVzQnlQYXRoKS50b0VxdWFsKFsnL3BhdGgvdG8vZm9vLnN0eWwnXSlcbiAgICAgICAgZXhwZWN0KGNvbGxlY3Rpb24udmFyaWFibGVzQnlQYXRoWycvcGF0aC90by9mb28uc3R5bCddLmxlbmd0aCkudG9FcXVhbCgzKVxuICAgICAgICBleHBlY3QoY29sbGVjdGlvbi5kZXBlbmRlbmN5R3JhcGgpLnRvRXF1YWwoe1xuICAgICAgICAgIGZvbzogWydiYXInXVxuICAgICAgICB9KVxuIl19
