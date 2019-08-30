(function() {
  var VariableScanner, path, registry, scopeFromFileName;

  path = require('path');

  VariableScanner = require('../lib/variable-scanner');

  registry = require('../lib/variable-expressions');

  scopeFromFileName = require('../lib/scope-from-file-name');

  describe('VariableScanner', function() {
    var editor, ref, scanner, scope, text, withScannerForTextEditor, withTextEditor;
    ref = [], scanner = ref[0], editor = ref[1], text = ref[2], scope = ref[3];
    withTextEditor = function(fixture, block) {
      return describe("with " + fixture + " buffer", function() {
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open(fixture);
          });
          return runs(function() {
            editor = atom.workspace.getActiveTextEditor();
            text = editor.getText();
            return scope = scopeFromFileName(editor.getPath());
          });
        });
        afterEach(function() {
          editor = null;
          return scope = null;
        });
        return block();
      });
    };
    withScannerForTextEditor = function(fixture, block) {
      return withTextEditor(fixture, function() {
        beforeEach(function() {
          return scanner = new VariableScanner({
            registry: registry,
            scope: scope
          });
        });
        afterEach(function() {
          return scanner = null;
        });
        return block();
      });
    };
    return describe('::search', function() {
      var result;
      result = [][0];
      withScannerForTextEditor('four-variables.styl', function() {
        beforeEach(function() {
          return result = scanner.search(text);
        });
        it('returns the first match', function() {
          return expect(result).toBeDefined();
        });
        describe('the result object', function() {
          it('has a match string', function() {
            return expect(result.match).toEqual('base-color = #fff');
          });
          it('has a lastIndex property', function() {
            return expect(result.lastIndex).toEqual(17);
          });
          it('has a range property', function() {
            return expect(result.range).toEqual([0, 17]);
          });
          return it('has a variable result', function() {
            expect(result[0].name).toEqual('base-color');
            expect(result[0].value).toEqual('#fff');
            expect(result[0].range).toEqual([0, 17]);
            return expect(result[0].line).toEqual(0);
          });
        });
        describe('the second result object', function() {
          beforeEach(function() {
            return result = scanner.search(text, result.lastIndex);
          });
          it('has a match string', function() {
            return expect(result.match).toEqual('other-color = transparentize(base-color, 50%)');
          });
          it('has a lastIndex property', function() {
            return expect(result.lastIndex).toEqual(64);
          });
          it('has a range property', function() {
            return expect(result.range).toEqual([19, 64]);
          });
          return it('has a variable result', function() {
            expect(result[0].name).toEqual('other-color');
            expect(result[0].value).toEqual('transparentize(base-color, 50%)');
            expect(result[0].range).toEqual([19, 64]);
            return expect(result[0].line).toEqual(2);
          });
        });
        return describe('successive searches', function() {
          return it('returns a result for each match and then undefined', function() {
            var doSearch;
            doSearch = function() {
              return result = scanner.search(text, result.lastIndex);
            };
            expect(doSearch()).toBeDefined();
            expect(doSearch()).toBeDefined();
            expect(doSearch()).toBeDefined();
            return expect(doSearch()).toBeUndefined();
          });
        });
      });
      withScannerForTextEditor('incomplete-stylus-hash.styl', function() {
        beforeEach(function() {
          return result = scanner.search(text);
        });
        return it('does not find any variables', function() {
          return expect(result).toBeUndefined();
        });
      });
      withScannerForTextEditor('variables-in-arguments.scss', function() {
        beforeEach(function() {
          return result = scanner.search(text);
        });
        return it('does not find any variables', function() {
          return expect(result).toBeUndefined();
        });
      });
      withScannerForTextEditor('attribute-selectors.scss', function() {
        beforeEach(function() {
          return result = scanner.search(text);
        });
        return it('does not find any variables', function() {
          return expect(result).toBeUndefined();
        });
      });
      withScannerForTextEditor('variables-in-conditions.scss', function() {
        beforeEach(function() {
          var doSearch;
          result = null;
          doSearch = function() {
            return result = scanner.search(text, result != null ? result.lastIndex : void 0);
          };
          doSearch();
          return doSearch();
        });
        return it('does not find the variable in the if clause', function() {
          return expect(result).toBeUndefined();
        });
      });
      withScannerForTextEditor('variables-after-mixins.scss', function() {
        beforeEach(function() {
          var doSearch;
          result = null;
          doSearch = function() {
            return result = scanner.search(text, result != null ? result.lastIndex : void 0);
          };
          return doSearch();
        });
        return it('finds the variable after the mixin', function() {
          return expect(result).toBeDefined();
        });
      });
      withScannerForTextEditor('variables-from-other-process.less', function() {
        beforeEach(function() {
          var doSearch;
          result = null;
          doSearch = function() {
            return result = scanner.search(text, result != null ? result.lastIndex : void 0);
          };
          return doSearch();
        });
        return it('finds the variable with an interpolation tag', function() {
          return expect(result).toBeDefined();
        });
      });
      return withScannerForTextEditor('crlf.styl', function() {
        beforeEach(function() {
          var doSearch;
          result = null;
          doSearch = function() {
            return result = scanner.search(text, result != null ? result.lastIndex : void 0);
          };
          doSearch();
          return doSearch();
        });
        return it('finds all the variables even with crlf mode', function() {
          return expect(result).toBeDefined();
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy92YXJpYWJsZS1zY2FubmVyLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsZUFBQSxHQUFrQixPQUFBLENBQVEseUJBQVI7O0VBQ2xCLFFBQUEsR0FBVyxPQUFBLENBQVEsNkJBQVI7O0VBQ1gsaUJBQUEsR0FBb0IsT0FBQSxDQUFRLDZCQUFSOztFQUVwQixRQUFBLENBQVMsaUJBQVQsRUFBNEIsU0FBQTtBQUMxQixRQUFBO0lBQUEsTUFBaUMsRUFBakMsRUFBQyxnQkFBRCxFQUFVLGVBQVYsRUFBa0IsYUFBbEIsRUFBd0I7SUFFeEIsY0FBQSxHQUFpQixTQUFDLE9BQUQsRUFBVSxLQUFWO2FBQ2YsUUFBQSxDQUFTLE9BQUEsR0FBUSxPQUFSLEdBQWdCLFNBQXpCLEVBQW1DLFNBQUE7UUFDakMsVUFBQSxDQUFXLFNBQUE7VUFDVCxlQUFBLENBQWdCLFNBQUE7bUJBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLE9BQXBCO1VBQUgsQ0FBaEI7aUJBQ0EsSUFBQSxDQUFLLFNBQUE7WUFDSCxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO1lBQ1QsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQUE7bUJBQ1AsS0FBQSxHQUFRLGlCQUFBLENBQWtCLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBbEI7VUFITCxDQUFMO1FBRlMsQ0FBWDtRQU9BLFNBQUEsQ0FBVSxTQUFBO1VBQ1IsTUFBQSxHQUFTO2lCQUNULEtBQUEsR0FBUTtRQUZBLENBQVY7ZUFJRyxLQUFILENBQUE7TUFaaUMsQ0FBbkM7SUFEZTtJQWVqQix3QkFBQSxHQUEyQixTQUFDLE9BQUQsRUFBVSxLQUFWO2FBQ3pCLGNBQUEsQ0FB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QTtpQkFDdkMsTUFBQSxDQUFPLE1BQVAsQ0FBYyxDQUFDLFdBQWYsQ0FBQTtRQUR1QyxDQUF6QztNQVBzRCxDQUF4RDtNQVVBLHdCQUFBLENBQXlCLG1DQUF6QixFQUE4RCxTQUFBO1FBQzVELFVBQUEsQ0FBVyxTQUFBO0FBQ1QsY0FBQTtVQUFBLE1BQUEsR0FBUztVQUNULFFBQUEsR0FBVyxTQUFBO21CQUFHLE1BQUEsR0FBUyxPQUFPLENBQUMsTUFBUixDQUFlLElBQWYsbUJBQXFCLE1BQU0sQ0FBRSxrQkFBN0I7VUFBWjtpQkFFWCxRQUFBLENBQUE7UUFKUyxDQUFYO2VBTUEsRUFBQSxDQUFHLDhDQUFILEVBQW1ELFNBQUE7aUJBQ2pELE1BQUEsQ0FBTyxNQUFQLENBQWMsQ0FBQyxXQUFmLENBQUE7UUFEaUQsQ0FBbkQ7TUFQNEQsQ0FBOUQ7YUFVQSx3QkFBQSxDQUF5QixXQUF6QixFQUFzQyxTQUFBO1FBQ3BDLFVBQUEsQ0FBVyxTQUFBO0FBQ1QsY0FBQTtVQUFBLE1BQUEsR0FBUztVQUNULFFBQUEsR0FBVyxTQUFBO21CQUFHLE1BQUEsR0FBUyxPQUFPLENBQUMsTUFBUixDQUFlLElBQWYsbUJBQXFCLE1BQU0sQ0FBRSxrQkFBN0I7VUFBWjtVQUVYLFFBQUEsQ0FBQTtpQkFDQSxRQUFBLENBQUE7UUFMUyxDQUFYO2VBT0EsRUFBQSxDQUFHLDZDQUFILEVBQWtELFNBQUE7aUJBQ2hELE1BQUEsQ0FBTyxNQUFQLENBQWMsQ0FBQyxXQUFmLENBQUE7UUFEZ0QsQ0FBbEQ7TUFSb0MsQ0FBdEM7SUEzR21CLENBQXJCO0VBMUIwQixDQUE1QjtBQUxBIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5WYXJpYWJsZVNjYW5uZXIgPSByZXF1aXJlICcuLi9saWIvdmFyaWFibGUtc2Nhbm5lcidcbnJlZ2lzdHJ5ID0gcmVxdWlyZSAnLi4vbGliL3ZhcmlhYmxlLWV4cHJlc3Npb25zJ1xuc2NvcGVGcm9tRmlsZU5hbWUgPSByZXF1aXJlICcuLi9saWIvc2NvcGUtZnJvbS1maWxlLW5hbWUnXG5cbmRlc2NyaWJlICdWYXJpYWJsZVNjYW5uZXInLCAtPlxuICBbc2Nhbm5lciwgZWRpdG9yLCB0ZXh0LCBzY29wZV0gPSBbXVxuXG4gIHdpdGhUZXh0RWRpdG9yID0gKGZpeHR1cmUsIGJsb2NrKSAtPlxuICAgIGRlc2NyaWJlIFwid2l0aCAje2ZpeHR1cmV9IGJ1ZmZlclwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS53b3Jrc3BhY2Uub3BlbihmaXh0dXJlKVxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICAgICAgdGV4dCA9IGVkaXRvci5nZXRUZXh0KClcbiAgICAgICAgICBzY29wZSA9IHNjb3BlRnJvbUZpbGVOYW1lKGVkaXRvci5nZXRQYXRoKCkpXG5cbiAgICAgIGFmdGVyRWFjaCAtPlxuICAgICAgICBlZGl0b3IgPSBudWxsXG4gICAgICAgIHNjb3BlID0gbnVsbFxuXG4gICAgICBkbyBibG9ja1xuXG4gIHdpdGhTY2FubmVyRm9yVGV4dEVkaXRvciA9IChmaXh0dXJlLCBibG9jaykgLT5cbiAgICB3aXRoVGV4dEVkaXRvciBmaXh0dXJlLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPiBzY2FubmVyID0gbmV3IFZhcmlhYmxlU2Nhbm5lcih7cmVnaXN0cnksIHNjb3BlfSlcblxuICAgICAgYWZ0ZXJFYWNoIC0+IHNjYW5uZXIgPSBudWxsXG5cbiAgICAgIGRvIGJsb2NrXG5cbiAgZGVzY3JpYmUgJzo6c2VhcmNoJywgLT5cbiAgICBbcmVzdWx0XSA9IFtdXG5cbiAgICB3aXRoU2Nhbm5lckZvclRleHRFZGl0b3IgJ2ZvdXItdmFyaWFibGVzLnN0eWwnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0KVxuXG4gICAgICBpdCAncmV0dXJucyB0aGUgZmlyc3QgbWF0Y2gnLCAtPlxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpXG5cbiAgICAgIGRlc2NyaWJlICd0aGUgcmVzdWx0IG9iamVjdCcsIC0+XG4gICAgICAgIGl0ICdoYXMgYSBtYXRjaCBzdHJpbmcnLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQubWF0Y2gpLnRvRXF1YWwoJ2Jhc2UtY29sb3IgPSAjZmZmJylcblxuICAgICAgICBpdCAnaGFzIGEgbGFzdEluZGV4IHByb3BlcnR5JywgLT5cbiAgICAgICAgICBleHBlY3QocmVzdWx0Lmxhc3RJbmRleCkudG9FcXVhbCgxNylcblxuICAgICAgICBpdCAnaGFzIGEgcmFuZ2UgcHJvcGVydHknLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQucmFuZ2UpLnRvRXF1YWwoWzAsMTddKVxuXG4gICAgICAgIGl0ICdoYXMgYSB2YXJpYWJsZSByZXN1bHQnLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHRbMF0ubmFtZSkudG9FcXVhbCgnYmFzZS1jb2xvcicpXG4gICAgICAgICAgZXhwZWN0KHJlc3VsdFswXS52YWx1ZSkudG9FcXVhbCgnI2ZmZicpXG4gICAgICAgICAgZXhwZWN0KHJlc3VsdFswXS5yYW5nZSkudG9FcXVhbChbMCwxN10pXG4gICAgICAgICAgZXhwZWN0KHJlc3VsdFswXS5saW5lKS50b0VxdWFsKDApXG5cbiAgICAgIGRlc2NyaWJlICd0aGUgc2Vjb25kIHJlc3VsdCBvYmplY3QnLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgcmVzdWx0ID0gc2Nhbm5lci5zZWFyY2godGV4dCwgcmVzdWx0Lmxhc3RJbmRleClcblxuICAgICAgICBpdCAnaGFzIGEgbWF0Y2ggc3RyaW5nJywgLT5cbiAgICAgICAgICBleHBlY3QocmVzdWx0Lm1hdGNoKS50b0VxdWFsKCdvdGhlci1jb2xvciA9IHRyYW5zcGFyZW50aXplKGJhc2UtY29sb3IsIDUwJSknKVxuXG4gICAgICAgIGl0ICdoYXMgYSBsYXN0SW5kZXggcHJvcGVydHknLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQubGFzdEluZGV4KS50b0VxdWFsKDY0KVxuXG4gICAgICAgIGl0ICdoYXMgYSByYW5nZSBwcm9wZXJ0eScsIC0+XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdC5yYW5nZSkudG9FcXVhbChbMTksNjRdKVxuXG4gICAgICAgIGl0ICdoYXMgYSB2YXJpYWJsZSByZXN1bHQnLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHRbMF0ubmFtZSkudG9FcXVhbCgnb3RoZXItY29sb3InKVxuICAgICAgICAgIGV4cGVjdChyZXN1bHRbMF0udmFsdWUpLnRvRXF1YWwoJ3RyYW5zcGFyZW50aXplKGJhc2UtY29sb3IsIDUwJSknKVxuICAgICAgICAgIGV4cGVjdChyZXN1bHRbMF0ucmFuZ2UpLnRvRXF1YWwoWzE5LDY0XSlcbiAgICAgICAgICBleHBlY3QocmVzdWx0WzBdLmxpbmUpLnRvRXF1YWwoMilcblxuICAgICAgZGVzY3JpYmUgJ3N1Y2Nlc3NpdmUgc2VhcmNoZXMnLCAtPlxuICAgICAgICBpdCAncmV0dXJucyBhIHJlc3VsdCBmb3IgZWFjaCBtYXRjaCBhbmQgdGhlbiB1bmRlZmluZWQnLCAtPlxuICAgICAgICAgIGRvU2VhcmNoID0gLT5cbiAgICAgICAgICAgIHJlc3VsdCA9IHNjYW5uZXIuc2VhcmNoKHRleHQsIHJlc3VsdC5sYXN0SW5kZXgpXG5cbiAgICAgICAgICBleHBlY3QoZG9TZWFyY2goKSkudG9CZURlZmluZWQoKVxuICAgICAgICAgIGV4cGVjdChkb1NlYXJjaCgpKS50b0JlRGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KGRvU2VhcmNoKCkpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoZG9TZWFyY2goKSkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICB3aXRoU2Nhbm5lckZvclRleHRFZGl0b3IgJ2luY29tcGxldGUtc3R5bHVzLWhhc2guc3R5bCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHJlc3VsdCA9IHNjYW5uZXIuc2VhcmNoKHRleHQpXG5cbiAgICAgIGl0ICdkb2VzIG5vdCBmaW5kIGFueSB2YXJpYWJsZXMnLCAtPlxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlVW5kZWZpbmVkKClcblxuICAgIHdpdGhTY2FubmVyRm9yVGV4dEVkaXRvciAndmFyaWFibGVzLWluLWFyZ3VtZW50cy5zY3NzJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcmVzdWx0ID0gc2Nhbm5lci5zZWFyY2godGV4dClcblxuICAgICAgaXQgJ2RvZXMgbm90IGZpbmQgYW55IHZhcmlhYmxlcycsIC0+XG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVVbmRlZmluZWQoKVxuXG4gICAgd2l0aFNjYW5uZXJGb3JUZXh0RWRpdG9yICdhdHRyaWJ1dGUtc2VsZWN0b3JzLnNjc3MnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0KVxuXG4gICAgICBpdCAnZG9lcyBub3QgZmluZCBhbnkgdmFyaWFibGVzJywgLT5cbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICB3aXRoU2Nhbm5lckZvclRleHRFZGl0b3IgJ3ZhcmlhYmxlcy1pbi1jb25kaXRpb25zLnNjc3MnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICByZXN1bHQgPSBudWxsXG4gICAgICAgIGRvU2VhcmNoID0gLT4gcmVzdWx0ID0gc2Nhbm5lci5zZWFyY2godGV4dCwgcmVzdWx0Py5sYXN0SW5kZXgpXG5cbiAgICAgICAgZG9TZWFyY2goKVxuICAgICAgICBkb1NlYXJjaCgpXG5cbiAgICAgIGl0ICdkb2VzIG5vdCBmaW5kIHRoZSB2YXJpYWJsZSBpbiB0aGUgaWYgY2xhdXNlJywgLT5cbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICB3aXRoU2Nhbm5lckZvclRleHRFZGl0b3IgJ3ZhcmlhYmxlcy1hZnRlci1taXhpbnMuc2NzcycsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHJlc3VsdCA9IG51bGxcbiAgICAgICAgZG9TZWFyY2ggPSAtPiByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0LCByZXN1bHQ/Lmxhc3RJbmRleClcblxuICAgICAgICBkb1NlYXJjaCgpXG5cbiAgICAgIGl0ICdmaW5kcyB0aGUgdmFyaWFibGUgYWZ0ZXIgdGhlIG1peGluJywgLT5cbiAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKVxuXG4gICAgd2l0aFNjYW5uZXJGb3JUZXh0RWRpdG9yICd2YXJpYWJsZXMtZnJvbS1vdGhlci1wcm9jZXNzLmxlc3MnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICByZXN1bHQgPSBudWxsXG4gICAgICAgIGRvU2VhcmNoID0gLT4gcmVzdWx0ID0gc2Nhbm5lci5zZWFyY2godGV4dCwgcmVzdWx0Py5sYXN0SW5kZXgpXG5cbiAgICAgICAgZG9TZWFyY2goKVxuXG4gICAgICBpdCAnZmluZHMgdGhlIHZhcmlhYmxlIHdpdGggYW4gaW50ZXJwb2xhdGlvbiB0YWcnLCAtPlxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpXG5cbiAgICB3aXRoU2Nhbm5lckZvclRleHRFZGl0b3IgJ2NybGYuc3R5bCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHJlc3VsdCA9IG51bGxcbiAgICAgICAgZG9TZWFyY2ggPSAtPiByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0LCByZXN1bHQ/Lmxhc3RJbmRleClcblxuICAgICAgICBkb1NlYXJjaCgpXG4gICAgICAgIGRvU2VhcmNoKClcblxuICAgICAgaXQgJ2ZpbmRzIGFsbCB0aGUgdmFyaWFibGVzIGV2ZW4gd2l0aCBjcmxmIG1vZGUnLCAtPlxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpXG4iXX0=
