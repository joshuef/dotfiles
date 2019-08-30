(function() {
  var ColorContext, ColorScanner, registry;

  ColorScanner = require('../lib/color-scanner');

  ColorContext = require('../lib/color-context');

  registry = require('../lib/color-expressions');

  describe('ColorScanner', function() {
    var editor, lastIndex, ref, result, scanner, text, withScannerForString, withScannerForTextEditor, withTextEditor;
    ref = [], scanner = ref[0], editor = ref[1], text = ref[2], result = ref[3], lastIndex = ref[4];
    withScannerForString = function(string, block) {
      return describe("with '" + (string.replace(/#/g, '+')) + "'", function() {
        beforeEach(function() {
          var context;
          text = string;
          context = new ColorContext({
            registry: registry
          });
          return scanner = new ColorScanner({
            context: context
          });
        });
        afterEach(function() {
          return scanner = null;
        });
        return block();
      });
    };
    withTextEditor = function(fixture, block) {
      return describe("with " + fixture + " buffer", function() {
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open(fixture);
          });
          return runs(function() {
            editor = atom.workspace.getActiveTextEditor();
            return text = editor.getText();
          });
        });
        afterEach(function() {
          return editor = null;
        });
        return block();
      });
    };
    withScannerForTextEditor = function(fixture, block) {
      return withTextEditor(fixture, function() {
        beforeEach(function() {
          var context;
          context = new ColorContext({
            registry: registry
          });
          return scanner = new ColorScanner({
            context: context
          });
        });
        afterEach(function() {
          return scanner = null;
        });
        return block();
      });
    };
    return describe('::search', function() {
      withScannerForTextEditor('html-entities.html', function() {
        beforeEach(function() {
          return result = scanner.search(text, 'html');
        });
        return it('returns nothing', function() {
          return expect(result).toBeUndefined();
        });
      });
      withScannerForTextEditor('css-color-with-prefix.less', function() {
        beforeEach(function() {
          return result = scanner.search(text, 'less');
        });
        return it('returns nothing', function() {
          return expect(result).toBeUndefined();
        });
      });
      withScannerForTextEditor('four-variables.styl', function() {
        beforeEach(function() {
          return result = scanner.search(text, 'styl');
        });
        it('returns the first buffer color match', function() {
          return expect(result).toBeDefined();
        });
        describe('the resulting buffer color', function() {
          it('has a text range', function() {
            return expect(result.range).toEqual([13, 17]);
          });
          it('has a color', function() {
            return expect(result.color).toBeColor('#ffffff');
          });
          it('stores the matched text', function() {
            return expect(result.match).toEqual('#fff');
          });
          it('stores the last index', function() {
            return expect(result.lastIndex).toEqual(17);
          });
          return it('stores match line', function() {
            return expect(result.line).toEqual(0);
          });
        });
        return describe('successive searches', function() {
          it('returns a buffer color for each match and then undefined', function() {
            var doSearch;
            doSearch = function() {
              return result = scanner.search(text, 'styl', result.lastIndex);
            };
            expect(doSearch()).toBeDefined();
            expect(doSearch()).toBeDefined();
            expect(doSearch()).toBeDefined();
            return expect(doSearch()).toBeUndefined();
          });
          return it('stores the line of successive matches', function() {
            var doSearch;
            doSearch = function() {
              return result = scanner.search(text, 'styl', result.lastIndex);
            };
            expect(doSearch().line).toEqual(2);
            expect(doSearch().line).toEqual(4);
            return expect(doSearch().line).toEqual(6);
          });
        });
      });
      withScannerForTextEditor('class-after-color.sass', function() {
        beforeEach(function() {
          return result = scanner.search(text, 'sass');
        });
        it('returns the first buffer color match', function() {
          return expect(result).toBeDefined();
        });
        return describe('the resulting buffer color', function() {
          it('has a text range', function() {
            return expect(result.range).toEqual([15, 20]);
          });
          return it('has a color', function() {
            return expect(result.color).toBeColor('#ffffff');
          });
        });
      });
      withScannerForTextEditor('project/styles/variables.styl', function() {
        beforeEach(function() {
          return result = scanner.search(text, 'styl');
        });
        it('returns the first buffer color match', function() {
          return expect(result).toBeDefined();
        });
        return describe('the resulting buffer color', function() {
          it('has a text range', function() {
            return expect(result.range).toEqual([18, 25]);
          });
          return it('has a color', function() {
            return expect(result.color).toBeColor('#BF616A');
          });
        });
      });
      withScannerForTextEditor('crlf.styl', function() {
        beforeEach(function() {
          return result = scanner.search(text, 'styl');
        });
        it('returns the first buffer color match', function() {
          return expect(result).toBeDefined();
        });
        describe('the resulting buffer color', function() {
          it('has a text range', function() {
            return expect(result.range).toEqual([7, 11]);
          });
          return it('has a color', function() {
            return expect(result.color).toBeColor('#ffffff');
          });
        });
        return it('finds the second color', function() {
          var doSearch;
          doSearch = function() {
            return result = scanner.search(text, 'styl', result.lastIndex);
          };
          doSearch();
          return expect(result.color).toBeDefined();
        });
      });
      withScannerForTextEditor('color-in-tag-content.html', function() {
        return it('finds both colors', function() {
          var doSearch;
          result = {
            lastIndex: 0
          };
          doSearch = function() {
            return result = scanner.search(text, 'css', result.lastIndex);
          };
          expect(doSearch()).toBeDefined();
          expect(doSearch()).toBeDefined();
          return expect(doSearch()).toBeUndefined();
        });
      });
      withScannerForString('#add-something {}, #acedbe-foo {}, #acedbeef-foo {}', function() {
        return it('does not find any matches', function() {
          var doSearch;
          result = {
            lastIndex: 0
          };
          doSearch = function() {
            return result = scanner.search(text, 'css', result.lastIndex);
          };
          return expect(doSearch()).toBeUndefined();
        });
      });
      return withScannerForString('#add_something {}, #acedbe_foo {}, #acedbeef_foo {}', function() {
        return it('does not find any matches', function() {
          var doSearch;
          result = {
            lastIndex: 0
          };
          doSearch = function() {
            return result = scanner.search(text, 'css', result.lastIndex);
          };
          return expect(doSearch()).toBeUndefined();
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9jb2xvci1zY2FubmVyLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxZQUFBLEdBQWUsT0FBQSxDQUFRLHNCQUFSOztFQUNmLFlBQUEsR0FBZSxPQUFBLENBQVEsc0JBQVI7O0VBQ2YsUUFBQSxHQUFXLE9BQUEsQ0FBUSwwQkFBUjs7RUFFWCxRQUFBLENBQVMsY0FBVCxFQUF5QixTQUFBO0FBQ3ZCLFFBQUE7SUFBQSxNQUE2QyxFQUE3QyxFQUFDLGdCQUFELEVBQVUsZUFBVixFQUFrQixhQUFsQixFQUF3QixlQUF4QixFQUFnQztJQUVoQyxvQkFBQSxHQUF1QixTQUFDLE1BQUQsRUFBUyxLQUFUO2FBQ3JCLFFBQUEsQ0FBUyxRQUFBLEdBQVEsQ0FBQyxNQUFNLENBQUMsT0FBUCxDQUFlLElBQWYsRUFBcUIsR0FBckIsQ0FBRCxDQUFSLEdBQW1DLEdBQTVDLEVBQWdELFNBQUE7UUFDOUMsVUFBQSxDQUFXLFNBQUE7QUFDVCxjQUFBO1VBQUEsSUFBQSxHQUFPO1VBQ1AsT0FBQSxHQUFjLElBQUEsWUFBQSxDQUFhO1lBQUMsVUFBQSxRQUFEO1dBQWI7aUJBQ2QsT0FBQSxHQUFjLElBQUEsWUFBQSxDQUFhO1lBQUMsU0FBQSxPQUFEO1dBQWI7UUFITCxDQUFYO1FBS0EsU0FBQSxDQUFVLFNBQUE7aUJBQUcsT0FBQSxHQUFVO1FBQWIsQ0FBVjtlQUVHLEtBQUgsQ0FBQTtNQVI4QyxDQUFoRDtJQURxQjtJQVd2QixjQUFBLEdBQWlCLFNBQUMsT0FBRCxFQUFVLEtBQVY7YUFDZixRQUFBLENBQVMsT0FBQSxHQUFRLE9BQVIsR0FBZ0IsU0FBekIsRUFBbUMsU0FBQTtRQUNqQyxVQUFBLENBQVcsU0FBQTtVQUNULGVBQUEsQ0FBZ0IsU0FBQTttQkFBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElB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TyxRQUFBLENBQUEsQ0FBUCxDQUFrQixDQUFDLFdBQW5CLENBQUE7VUFDQSxNQUFBLENBQU8sUUFBQSxDQUFBLENBQVAsQ0FBa0IsQ0FBQyxXQUFuQixDQUFBO2lCQUNBLE1BQUEsQ0FBTyxRQUFBLENBQUEsQ0FBUCxDQUFrQixDQUFDLGFBQW5CLENBQUE7UUFOc0IsQ0FBeEI7TUFEb0QsQ0FBdEQ7TUFTQSxvQkFBQSxDQUFxQixxREFBckIsRUFBNEUsU0FBQTtlQUMxRSxFQUFBLENBQUcsMkJBQUgsRUFBZ0MsU0FBQTtBQUM5QixjQUFBO1VBQUEsTUFBQSxHQUFTO1lBQUEsU0FBQSxFQUFXLENBQVg7O1VBQ1QsUUFBQSxHQUFXLFNBQUE7bUJBQUcsTUFBQSxHQUFTLE9BQU8sQ0FBQyxNQUFSLENBQWUsSUFBZixFQUFxQixLQUFyQixFQUE0QixNQUFNLENBQUMsU0FBbkM7VUFBWjtpQkFFWCxNQUFBLENBQU8sUUFBQSxDQUFBLENBQVAsQ0FBa0IsQ0FBQyxhQUFuQixDQUFBO1FBSjhCLENBQWhDO01BRDBFLENBQTVFO2FBT0Esb0JBQUEsQ0FBcUIscURBQXJCLEVBQTRFLFNBQUE7ZUFDMUUsRUFBQSxDQUFHLDJCQUFILEVBQWdDLFNBQUE7QUFDOUIsY0FBQTtVQUFBLE1BQUEsR0FBUztZQUFBLFNBQUEsRUFBVyxDQUFYOztVQUNULFFBQUEsR0FBVyxTQUFBO21CQUFHLE1BQUEsR0FBUyxPQUFPLENBQUMsTUFBUixDQUFlLElBQWYsRUFBcUIsS0FBckIsRUFBNEIsTUFBTSxDQUFDLFNBQW5DO1VBQVo7aUJBRVgsTUFBQSxDQUFPLFFBQUEsQ0FBQSxDQUFQLENBQWtCLENBQUMsYUFBbkIsQ0FBQTtRQUo4QixDQUFoQztNQUQwRSxDQUE1RTtJQXZIbUIsQ0FBckI7RUFwQ3VCLENBQXpCO0FBSkEiLCJzb3VyY2VzQ29udGVudCI6WyJDb2xvclNjYW5uZXIgPSByZXF1aXJlICcuLi9saWIvY29sb3Itc2Nhbm5lcidcbkNvbG9yQ29udGV4dCA9IHJlcXVpcmUgJy4uL2xpYi9jb2xvci1jb250ZXh0J1xucmVnaXN0cnkgPSByZXF1aXJlICcuLi9saWIvY29sb3ItZXhwcmVzc2lvbnMnXG5cbmRlc2NyaWJlICdDb2xvclNjYW5uZXInLCAtPlxuICBbc2Nhbm5lciwgZWRpdG9yLCB0ZXh0LCByZXN1bHQsIGxhc3RJbmRleF0gPSBbXVxuXG4gIHdpdGhTY2FubmVyRm9yU3RyaW5nID0gKHN0cmluZywgYmxvY2spIC0+XG4gICAgZGVzY3JpYmUgXCJ3aXRoICcje3N0cmluZy5yZXBsYWNlKC8jL2csICcrJyl9J1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICB0ZXh0ID0gc3RyaW5nXG4gICAgICAgIGNvbnRleHQgPSBuZXcgQ29sb3JDb250ZXh0KHtyZWdpc3RyeX0pXG4gICAgICAgIHNjYW5uZXIgPSBuZXcgQ29sb3JTY2FubmVyKHtjb250ZXh0fSlcblxuICAgICAgYWZ0ZXJFYWNoIC0+IHNjYW5uZXIgPSBudWxsXG5cbiAgICAgIGRvIGJsb2NrXG5cbiAgd2l0aFRleHRFZGl0b3IgPSAoZml4dHVyZSwgYmxvY2spIC0+XG4gICAgZGVzY3JpYmUgXCJ3aXRoICN7Zml4dHVyZX0gYnVmZmVyXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLndvcmtzcGFjZS5vcGVuKGZpeHR1cmUpXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgICB0ZXh0ID0gZWRpdG9yLmdldFRleHQoKVxuXG4gICAgICBhZnRlckVhY2ggLT4gZWRpdG9yID0gbnVsbFxuXG4gICAgICBkbyBibG9ja1xuXG4gIHdpdGhTY2FubmVyRm9yVGV4dEVkaXRvciA9IChmaXh0dXJlLCBibG9jaykgLT5cbiAgICB3aXRoVGV4dEVkaXRvciBmaXh0dXJlLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBjb250ZXh0ID0gbmV3IENvbG9yQ29udGV4dCh7cmVnaXN0cnl9KVxuICAgICAgICBzY2FubmVyID0gbmV3IENvbG9yU2Nhbm5lcih7Y29udGV4dH0pXG5cbiAgICAgIGFmdGVyRWFjaCAtPiBzY2FubmVyID0gbnVsbFxuXG4gICAgICBkbyBibG9ja1xuXG4gIGRlc2NyaWJlICc6OnNlYXJjaCcsIC0+XG4gICAgd2l0aFNjYW5uZXJGb3JUZXh0RWRpdG9yICdodG1sLWVudGl0aWVzLmh0bWwnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0LCAnaHRtbCcpXG5cbiAgICAgIGl0ICdyZXR1cm5zIG5vdGhpbmcnLCAtPlxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlVW5kZWZpbmVkKClcblxuICAgIHdpdGhTY2FubmVyRm9yVGV4dEVkaXRvciAnY3NzLWNvbG9yLXdpdGgtcHJlZml4Lmxlc3MnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0LCAnbGVzcycpXG5cbiAgICAgIGl0ICdyZXR1cm5zIG5vdGhpbmcnLCAtPlxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlVW5kZWZpbmVkKClcblxuICAgIHdpdGhTY2FubmVyRm9yVGV4dEVkaXRvciAnZm91ci12YXJpYWJsZXMuc3R5bCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHJlc3VsdCA9IHNjYW5uZXIuc2VhcmNoKHRleHQsICdzdHlsJylcblxuICAgICAgaXQgJ3JldHVybnMgdGhlIGZpcnN0IGJ1ZmZlciBjb2xvciBtYXRjaCcsIC0+XG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKClcblxuICAgICAgZGVzY3JpYmUgJ3RoZSByZXN1bHRpbmcgYnVmZmVyIGNvbG9yJywgLT5cbiAgICAgICAgaXQgJ2hhcyBhIHRleHQgcmFuZ2UnLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQucmFuZ2UpLnRvRXF1YWwoWzEzLDE3XSlcblxuICAgICAgICBpdCAnaGFzIGEgY29sb3InLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQuY29sb3IpLnRvQmVDb2xvcignI2ZmZmZmZicpXG5cbiAgICAgICAgaXQgJ3N0b3JlcyB0aGUgbWF0Y2hlZCB0ZXh0JywgLT5cbiAgICAgICAgICBleHBlY3QocmVzdWx0Lm1hdGNoKS50b0VxdWFsKCcjZmZmJylcblxuICAgICAgICBpdCAnc3RvcmVzIHRoZSBsYXN0IGluZGV4JywgLT5cbiAgICAgICAgICBleHBlY3QocmVzdWx0Lmxhc3RJbmRleCkudG9FcXVhbCgxNylcblxuICAgICAgICBpdCAnc3RvcmVzIG1hdGNoIGxpbmUnLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQubGluZSkudG9FcXVhbCgwKVxuXG4gICAgICBkZXNjcmliZSAnc3VjY2Vzc2l2ZSBzZWFyY2hlcycsIC0+XG4gICAgICAgIGl0ICdyZXR1cm5zIGEgYnVmZmVyIGNvbG9yIGZvciBlYWNoIG1hdGNoIGFuZCB0aGVuIHVuZGVmaW5lZCcsIC0+XG4gICAgICAgICAgZG9TZWFyY2ggPSAtPiByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0LCAnc3R5bCcsIHJlc3VsdC5sYXN0SW5kZXgpXG5cbiAgICAgICAgICBleHBlY3QoZG9TZWFyY2goKSkudG9CZURlZmluZWQoKVxuICAgICAgICAgIGV4cGVjdChkb1NlYXJjaCgpKS50b0JlRGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KGRvU2VhcmNoKCkpLnRvQmVEZWZpbmVkKClcbiAgICAgICAgICBleHBlY3QoZG9TZWFyY2goKSkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICAgICAgaXQgJ3N0b3JlcyB0aGUgbGluZSBvZiBzdWNjZXNzaXZlIG1hdGNoZXMnLCAtPlxuICAgICAgICAgIGRvU2VhcmNoID0gLT4gcmVzdWx0ID0gc2Nhbm5lci5zZWFyY2godGV4dCwgJ3N0eWwnLCByZXN1bHQubGFzdEluZGV4KVxuXG4gICAgICAgICAgZXhwZWN0KGRvU2VhcmNoKCkubGluZSkudG9FcXVhbCgyKVxuICAgICAgICAgIGV4cGVjdChkb1NlYXJjaCgpLmxpbmUpLnRvRXF1YWwoNClcbiAgICAgICAgICBleHBlY3QoZG9TZWFyY2goKS5saW5lKS50b0VxdWFsKDYpXG5cbiAgICB3aXRoU2Nhbm5lckZvclRleHRFZGl0b3IgJ2NsYXNzLWFmdGVyLWNvbG9yLnNhc3MnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0LCAnc2FzcycpXG5cbiAgICAgIGl0ICdyZXR1cm5zIHRoZSBmaXJzdCBidWZmZXIgY29sb3IgbWF0Y2gnLCAtPlxuICAgICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpXG5cbiAgICAgIGRlc2NyaWJlICd0aGUgcmVzdWx0aW5nIGJ1ZmZlciBjb2xvcicsIC0+XG4gICAgICAgIGl0ICdoYXMgYSB0ZXh0IHJhbmdlJywgLT5cbiAgICAgICAgICBleHBlY3QocmVzdWx0LnJhbmdlKS50b0VxdWFsKFsxNSwyMF0pXG5cbiAgICAgICAgaXQgJ2hhcyBhIGNvbG9yJywgLT5cbiAgICAgICAgICBleHBlY3QocmVzdWx0LmNvbG9yKS50b0JlQ29sb3IoJyNmZmZmZmYnKVxuXG4gICAgd2l0aFNjYW5uZXJGb3JUZXh0RWRpdG9yICdwcm9qZWN0L3N0eWxlcy92YXJpYWJsZXMuc3R5bCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHJlc3VsdCA9IHNjYW5uZXIuc2VhcmNoKHRleHQsICdzdHlsJylcblxuICAgICAgaXQgJ3JldHVybnMgdGhlIGZpcnN0IGJ1ZmZlciBjb2xvciBtYXRjaCcsIC0+XG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKClcblxuICAgICAgZGVzY3JpYmUgJ3RoZSByZXN1bHRpbmcgYnVmZmVyIGNvbG9yJywgLT5cbiAgICAgICAgaXQgJ2hhcyBhIHRleHQgcmFuZ2UnLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQucmFuZ2UpLnRvRXF1YWwoWzE4LDI1XSlcblxuICAgICAgICBpdCAnaGFzIGEgY29sb3InLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQuY29sb3IpLnRvQmVDb2xvcignI0JGNjE2QScpXG5cbiAgICB3aXRoU2Nhbm5lckZvclRleHRFZGl0b3IgJ2NybGYuc3R5bCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHJlc3VsdCA9IHNjYW5uZXIuc2VhcmNoKHRleHQsICdzdHlsJylcblxuICAgICAgaXQgJ3JldHVybnMgdGhlIGZpcnN0IGJ1ZmZlciBjb2xvciBtYXRjaCcsIC0+XG4gICAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKClcblxuICAgICAgZGVzY3JpYmUgJ3RoZSByZXN1bHRpbmcgYnVmZmVyIGNvbG9yJywgLT5cbiAgICAgICAgaXQgJ2hhcyBhIHRleHQgcmFuZ2UnLCAtPlxuICAgICAgICAgIGV4cGVjdChyZXN1bHQucmFuZ2UpLnRvRXF1YWwoWzcsMTFdKVxuXG4gICAgICAgIGl0ICdoYXMgYSBjb2xvcicsIC0+XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdC5jb2xvcikudG9CZUNvbG9yKCcjZmZmZmZmJylcblxuICAgICAgaXQgJ2ZpbmRzIHRoZSBzZWNvbmQgY29sb3InLCAtPlxuICAgICAgICBkb1NlYXJjaCA9IC0+IHJlc3VsdCA9IHNjYW5uZXIuc2VhcmNoKHRleHQsICdzdHlsJywgcmVzdWx0Lmxhc3RJbmRleClcblxuICAgICAgICBkb1NlYXJjaCgpXG5cbiAgICAgICAgZXhwZWN0KHJlc3VsdC5jb2xvcikudG9CZURlZmluZWQoKVxuXG4gICAgd2l0aFNjYW5uZXJGb3JUZXh0RWRpdG9yICdjb2xvci1pbi10YWctY29udGVudC5odG1sJywgLT5cbiAgICAgIGl0ICdmaW5kcyBib3RoIGNvbG9ycycsIC0+XG4gICAgICAgIHJlc3VsdCA9IGxhc3RJbmRleDogMFxuICAgICAgICBkb1NlYXJjaCA9IC0+IHJlc3VsdCA9IHNjYW5uZXIuc2VhcmNoKHRleHQsICdjc3MnLCByZXN1bHQubGFzdEluZGV4KVxuXG4gICAgICAgIGV4cGVjdChkb1NlYXJjaCgpKS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChkb1NlYXJjaCgpKS50b0JlRGVmaW5lZCgpXG4gICAgICAgIGV4cGVjdChkb1NlYXJjaCgpKS50b0JlVW5kZWZpbmVkKClcblxuICAgIHdpdGhTY2FubmVyRm9yU3RyaW5nICcjYWRkLXNvbWV0aGluZyB7fSwgI2FjZWRiZS1mb28ge30sICNhY2VkYmVlZi1mb28ge30nLCAtPlxuICAgICAgaXQgJ2RvZXMgbm90IGZpbmQgYW55IG1hdGNoZXMnLCAtPlxuICAgICAgICByZXN1bHQgPSBsYXN0SW5kZXg6IDBcbiAgICAgICAgZG9TZWFyY2ggPSAtPiByZXN1bHQgPSBzY2FubmVyLnNlYXJjaCh0ZXh0LCAnY3NzJywgcmVzdWx0Lmxhc3RJbmRleClcblxuICAgICAgICBleHBlY3QoZG9TZWFyY2goKSkudG9CZVVuZGVmaW5lZCgpXG5cbiAgICB3aXRoU2Nhbm5lckZvclN0cmluZyAnI2FkZF9zb21ldGhpbmcge30sICNhY2VkYmVfZm9vIHt9LCAjYWNlZGJlZWZfZm9vIHt9JywgLT5cbiAgICAgIGl0ICdkb2VzIG5vdCBmaW5kIGFueSBtYXRjaGVzJywgLT5cbiAgICAgICAgcmVzdWx0ID0gbGFzdEluZGV4OiAwXG4gICAgICAgIGRvU2VhcmNoID0gLT4gcmVzdWx0ID0gc2Nhbm5lci5zZWFyY2godGV4dCwgJ2NzcycsIHJlc3VsdC5sYXN0SW5kZXgpXG5cbiAgICAgICAgZXhwZWN0KGRvU2VhcmNoKCkpLnRvQmVVbmRlZmluZWQoKVxuIl19
