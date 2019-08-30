(function() {
  var ColorSearch, click;

  click = require('./helpers/events').click;

  ColorSearch = require('../lib/color-search');

  describe('ColorResultsElement', function() {
    var completeSpy, findSpy, pigments, project, ref, resultsElement, search;
    ref = [], search = ref[0], resultsElement = ref[1], pigments = ref[2], project = ref[3], completeSpy = ref[4], findSpy = ref[5];
    beforeEach(function() {
      atom.config.set('pigments.sourceNames', ['**/*.styl', '**/*.less']);
      waitsForPromise(function() {
        return atom.packages.activatePackage('pigments').then(function(pkg) {
          pigments = pkg.mainModule;
          return project = pigments.getProject();
        });
      });
      waitsForPromise(function() {
        return project.initialize();
      });
      return runs(function() {
        search = project.findAllColors();
        spyOn(search, 'search').andCallThrough();
        completeSpy = jasmine.createSpy('did-complete-search');
        search.onDidCompleteSearch(completeSpy);
        resultsElement = atom.views.getView(search);
        return jasmine.attachToDOM(resultsElement);
      });
    });
    afterEach(function() {
      return waitsFor(function() {
        return completeSpy.callCount > 0;
      });
    });
    it('is associated with ColorSearch model', function() {
      return expect(resultsElement).toBeDefined();
    });
    it('starts the search', function() {
      return expect(search.search).toHaveBeenCalled();
    });
    return describe('when matches are found', function() {
      beforeEach(function() {
        return waitsFor(function() {
          return completeSpy.callCount > 0;
        });
      });
      it('groups results by files', function() {
        var fileResults;
        fileResults = resultsElement.querySelectorAll('.list-nested-item');
        expect(fileResults.length).toEqual(8);
        return expect(fileResults[0].querySelectorAll('li.list-item').length).toEqual(3);
      });
      describe('when a file item is clicked', function() {
        var fileItem;
        fileItem = [][0];
        beforeEach(function() {
          fileItem = resultsElement.querySelector('.list-nested-item > .list-item');
          return click(fileItem);
        });
        return it('collapses the file matches', function() {
          return expect(resultsElement.querySelector('.list-nested-item.collapsed')).toExist();
        });
      });
      return describe('when a matches item is clicked', function() {
        var matchItem, ref1, spy;
        ref1 = [], matchItem = ref1[0], spy = ref1[1];
        beforeEach(function() {
          spy = jasmine.createSpy('did-add-text-editor');
          atom.workspace.onDidAddTextEditor(spy);
          matchItem = resultsElement.querySelector('.search-result.list-item');
          click(matchItem);
          return waitsFor(function() {
            return spy.callCount > 0;
          });
        });
        return it('opens the file', function() {
          var textEditor;
          expect(spy).toHaveBeenCalled();
          textEditor = spy.argsForCall[0][0].textEditor;
          return expect(textEditor.getSelectedBufferRange()).toEqual([[1, 13], [1, 23]]);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9jb2xvci1yZXN1bHRzLWVsZW1lbnQtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLFFBQVMsT0FBQSxDQUFRLGtCQUFSOztFQUNWLFdBQUEsR0FBYyxPQUFBLENBQVEscUJBQVI7O0VBRWQsUUFBQSxDQUFTLHFCQUFULEVBQWdDLFNBQUE7QUFDOUIsUUFBQTtJQUFBLE1BQW9FLEVBQXBFLEVBQUMsZUFBRCxFQUFTLHVCQUFULEVBQXlCLGlCQUF6QixFQUFtQyxnQkFBbkMsRUFBNEMsb0JBQTVDLEVBQXlEO0lBRXpELFVBQUEsQ0FBVyxTQUFBO01BQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHNCQUFoQixFQUF3QyxDQUN0QyxXQURzQyxFQUV0QyxXQUZzQyxDQUF4QztNQUtBLGVBQUEsQ0FBZ0IsU0FBQTtlQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixVQUE5QixDQUF5QyxDQUFDLElBQTFDLENBQStDLFNBQUMsR0FBRDtVQUNoRSxRQUFBLEdBQVcsR0FBRyxDQUFDO2lCQUNmLE9BQUEsR0FBVSxRQUFRLENBQUMsVUFBVCxDQUFBO1FBRnNELENBQS9DO01BQUgsQ0FBaEI7TUFJQSxlQUFBLENBQWdCLFNBQUE7ZUFBRyxPQUFPLENBQUMsVUFBUixDQUFBO01BQUgsQ0FBaEI7YUFFQSxJQUFBLENBQUssU0FBQTtRQUNILE1BQUEsR0FBUyxPQUFPLENBQUMsYUFBUixDQUFBO1FBQ1QsS0FBQSxDQUFNLE1BQU4sRUFBYyxRQUFkLENBQXVCLENBQUMsY0FBeEIsQ0FBQTtRQUNBLFdBQUEsR0FBYyxPQUFPLENBQUMsU0FBUixDQUFrQixxQkFBbEI7UUFDZCxNQUFNLENBQUMsbUJBQVAsQ0FBMkIsV0FBM0I7UUFFQSxjQUFBLEdBQWlCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixNQUFuQjtlQUVqQixPQUFPLENBQUMsV0FBUixDQUFvQixjQUFwQjtNQVJHLENBQUw7SUFaUyxDQUFYO0lBc0JBLFNBQUEsQ0FBVSxTQUFBO2FBQUcsUUFBQSxDQUFTLFNBQUE7ZUFBRyxXQUFXLENBQUMsU0FBWixHQUF3QjtNQUEzQixDQUFUO0lBQUgsQ0FBVjtJQUVBLEVBQUEsQ0FBRyxzQ0FBSCxFQUEyQyxTQUFBO2FBQ3pDLE1BQUEsQ0FBTyxjQUFQLENBQXNCLENBQUMsV0FBdkIsQ0FBQTtJQUR5QyxDQUEzQztJQUdBLEVBQUEsQ0FBRyxtQkFBSCxFQUF3QixTQUFBO2FBQ3RCLE1BQUEsQ0FBTyxNQUFNLENBQUMsTUFBZCxDQUFxQixDQUFDLGdCQUF0QixDQUFBO0lBRHNCLENBQXhCO1dBR0EsUUFBQSxDQUFTLHdCQUFULEVBQW1DLFNBQUE7TUFDakMsVUFBQSxDQUFXLFNBQUE7ZUFBRyxRQUFBLENBQVMsU0FBQTtpQkFBRyxXQUFXLENBQUMsU0FBWixHQUF3QjtRQUEzQixDQUFUO01BQUgsQ0FBWDtNQUVBLEVBQUEsQ0FBRyx5QkFBSCxFQUE4QixTQUFBO0FBQzVCLFlBQUE7UUFBQSxXQUFBLEdBQWMsY0FBYyxDQUFDLGdCQUFmLENBQWdDLG1CQUFoQztRQUVkLE1BQUEsQ0FBTyxXQUFXLENBQUMsTUFBbkIsQ0FBMEIsQ0FBQyxPQUEzQixDQUFtQyxDQUFuQztlQUVBLE1BQUEsQ0FBTyxXQUFZLENBQUEsQ0FBQSxDQUFFLENBQUMsZ0JBQWYsQ0FBZ0MsY0FBaEMsQ0FBK0MsQ0FBQyxNQUF2RCxDQUE4RCxDQUFDLE9BQS9ELENBQXVFLENBQXZFO01BTDRCLENBQTlCO01BT0EsUUFBQSxDQUFTLDZCQUFULEVBQXdDLFNBQUE7QUFDdEMsWUFBQTtRQUFDLFdBQVk7UUFDYixVQUFBLENBQVcsU0FBQTtVQUNULFFBQUEsR0FBVyxjQUFjLENBQUMsYUFBZixDQUE2QixnQ0FBN0I7aUJBQ1gsS0FBQSxDQUFNLFFBQU47UUFGUyxDQUFYO2VBSUEsRUFBQSxDQUFHLDRCQUFILEVBQWlDLFNBQUE7aUJBQy9CLE1BQUEsQ0FBTyxjQUFjLENBQUMsYUFBZixDQUE2Qiw2QkFBN0IsQ0FBUCxDQUFtRSxDQUFDLE9BQXBFLENBQUE7UUFEK0IsQ0FBakM7TUFOc0MsQ0FBeEM7YUFTQSxRQUFBLENBQVMsZ0NBQVQsRUFBMkMsU0FBQTtBQUN6QyxZQUFBO1FBQUEsT0FBbUIsRUFBbkIsRUFBQyxtQkFBRCxFQUFZO1FBQ1osVUFBQSxDQUFXLFNBQUE7VUFDVCxHQUFBLEdBQU0sT0FBTyxDQUFDLFNBQVIsQ0FBa0IscUJBQWxCO1VBRU4sSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxHQUFsQztVQUNBLFNBQUEsR0FBWSxjQUFjLENBQUMsYUFBZixDQUE2QiwwQkFBN0I7VUFDWixLQUFBLENBQU0sU0FBTjtpQkFFQSxRQUFBLENBQVMsU0FBQTttQkFBRyxHQUFHLENBQUMsU0FBSixHQUFnQjtVQUFuQixDQUFUO1FBUFMsQ0FBWDtlQVNBLEVBQUEsQ0FBRyxnQkFBSCxFQUFxQixTQUFBO0FBQ25CLGNBQUE7VUFBQSxNQUFBLENBQU8sR0FBUCxDQUFXLENBQUMsZ0JBQVosQ0FBQTtVQUNDLGFBQWMsR0FBRyxDQUFDLFdBQVksQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBO2lCQUNsQyxNQUFBLENBQU8sVUFBVSxDQUFDLHNCQUFYLENBQUEsQ0FBUCxDQUEyQyxDQUFDLE9BQTVDLENBQW9ELENBQUMsQ0FBQyxDQUFELEVBQUcsRUFBSCxDQUFELEVBQVEsQ0FBQyxDQUFELEVBQUcsRUFBSCxDQUFSLENBQXBEO1FBSG1CLENBQXJCO01BWHlDLENBQTNDO0lBbkJpQyxDQUFuQztFQWpDOEIsQ0FBaEM7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntjbGlja30gPSByZXF1aXJlICcuL2hlbHBlcnMvZXZlbnRzJ1xuQ29sb3JTZWFyY2ggPSByZXF1aXJlICcuLi9saWIvY29sb3Itc2VhcmNoJ1xuXG5kZXNjcmliZSAnQ29sb3JSZXN1bHRzRWxlbWVudCcsIC0+XG4gIFtzZWFyY2gsIHJlc3VsdHNFbGVtZW50LCBwaWdtZW50cywgcHJvamVjdCwgY29tcGxldGVTcHksIGZpbmRTcHldID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5zb3VyY2VOYW1lcycsIFtcbiAgICAgICcqKi8qLnN0eWwnXG4gICAgICAnKiovKi5sZXNzJ1xuICAgIF1cblxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPiBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgncGlnbWVudHMnKS50aGVuIChwa2cpIC0+XG4gICAgICBwaWdtZW50cyA9IHBrZy5tYWluTW9kdWxlXG4gICAgICBwcm9qZWN0ID0gcGlnbWVudHMuZ2V0UHJvamVjdCgpXG5cbiAgICB3YWl0c0ZvclByb21pc2UgLT4gcHJvamVjdC5pbml0aWFsaXplKClcblxuICAgIHJ1bnMgLT5cbiAgICAgIHNlYXJjaCA9IHByb2plY3QuZmluZEFsbENvbG9ycygpXG4gICAgICBzcHlPbihzZWFyY2gsICdzZWFyY2gnKS5hbmRDYWxsVGhyb3VnaCgpXG4gICAgICBjb21wbGV0ZVNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdkaWQtY29tcGxldGUtc2VhcmNoJylcbiAgICAgIHNlYXJjaC5vbkRpZENvbXBsZXRlU2VhcmNoKGNvbXBsZXRlU3B5KVxuXG4gICAgICByZXN1bHRzRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhzZWFyY2gpXG5cbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00ocmVzdWx0c0VsZW1lbnQpXG5cbiAgYWZ0ZXJFYWNoIC0+IHdhaXRzRm9yIC0+IGNvbXBsZXRlU3B5LmNhbGxDb3VudCA+IDBcblxuICBpdCAnaXMgYXNzb2NpYXRlZCB3aXRoIENvbG9yU2VhcmNoIG1vZGVsJywgLT5cbiAgICBleHBlY3QocmVzdWx0c0VsZW1lbnQpLnRvQmVEZWZpbmVkKClcblxuICBpdCAnc3RhcnRzIHRoZSBzZWFyY2gnLCAtPlxuICAgIGV4cGVjdChzZWFyY2guc2VhcmNoKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICBkZXNjcmliZSAnd2hlbiBtYXRjaGVzIGFyZSBmb3VuZCcsIC0+XG4gICAgYmVmb3JlRWFjaCAtPiB3YWl0c0ZvciAtPiBjb21wbGV0ZVNweS5jYWxsQ291bnQgPiAwXG5cbiAgICBpdCAnZ3JvdXBzIHJlc3VsdHMgYnkgZmlsZXMnLCAtPlxuICAgICAgZmlsZVJlc3VsdHMgPSByZXN1bHRzRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGlzdC1uZXN0ZWQtaXRlbScpXG5cbiAgICAgIGV4cGVjdChmaWxlUmVzdWx0cy5sZW5ndGgpLnRvRXF1YWwoOClcblxuICAgICAgZXhwZWN0KGZpbGVSZXN1bHRzWzBdLnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpLmxpc3QtaXRlbScpLmxlbmd0aCkudG9FcXVhbCgzKVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gYSBmaWxlIGl0ZW0gaXMgY2xpY2tlZCcsIC0+XG4gICAgICBbZmlsZUl0ZW1dID0gW11cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgZmlsZUl0ZW0gPSByZXN1bHRzRWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubGlzdC1uZXN0ZWQtaXRlbSA+IC5saXN0LWl0ZW0nKVxuICAgICAgICBjbGljayhmaWxlSXRlbSlcblxuICAgICAgaXQgJ2NvbGxhcHNlcyB0aGUgZmlsZSBtYXRjaGVzJywgLT5cbiAgICAgICAgZXhwZWN0KHJlc3VsdHNFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5saXN0LW5lc3RlZC1pdGVtLmNvbGxhcHNlZCcpKS50b0V4aXN0KClcblxuICAgIGRlc2NyaWJlICd3aGVuIGEgbWF0Y2hlcyBpdGVtIGlzIGNsaWNrZWQnLCAtPlxuICAgICAgW21hdGNoSXRlbSwgc3B5XSA9IFtdXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdkaWQtYWRkLXRleHQtZWRpdG9yJylcblxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vbkRpZEFkZFRleHRFZGl0b3Ioc3B5KVxuICAgICAgICBtYXRjaEl0ZW0gPSByZXN1bHRzRWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuc2VhcmNoLXJlc3VsdC5saXN0LWl0ZW0nKVxuICAgICAgICBjbGljayhtYXRjaEl0ZW0pXG5cbiAgICAgICAgd2FpdHNGb3IgLT4gc3B5LmNhbGxDb3VudCA+IDBcblxuICAgICAgaXQgJ29wZW5zIHRoZSBmaWxlJywgLT5cbiAgICAgICAgZXhwZWN0KHNweSkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgIHt0ZXh0RWRpdG9yfSA9IHNweS5hcmdzRm9yQ2FsbFswXVswXVxuICAgICAgICBleHBlY3QodGV4dEVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCkpLnRvRXF1YWwoW1sxLDEzXSxbMSwyM11dKVxuIl19
