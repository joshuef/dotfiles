(function() {
  var ColorSearch;

  require('./helpers/matchers');

  ColorSearch = require('../lib/color-search');

  describe('ColorSearch', function() {
    var pigments, project, ref, search;
    ref = [], search = ref[0], pigments = ref[1], project = ref[2];
    beforeEach(function() {
      atom.config.set('pigments.sourceNames', ['**/*.styl', '**/*.less']);
      atom.config.set('pigments.extendedSearchNames', ['**/*.css']);
      atom.config.set('pigments.ignoredNames', ['project/vendor/**']);
      waitsForPromise(function() {
        return atom.packages.activatePackage('pigments').then(function(pkg) {
          pigments = pkg.mainModule;
          return project = pigments.getProject();
        });
      });
      return waitsForPromise(function() {
        return project.initialize();
      });
    });
    return describe('when created with basic options', function() {
      beforeEach(function() {
        return search = project.findAllColors();
      });
      it('dispatches a did-complete-search when finalizing its search', function() {
        var spy;
        spy = jasmine.createSpy('did-complete-search');
        search.onDidCompleteSearch(spy);
        search.search();
        waitsFor(function() {
          return spy.callCount > 0;
        });
        return runs(function() {
          return expect(spy.argsForCall[0][0].length).toEqual(26);
        });
      });
      return it('dispatches a did-find-matches event for every file', function() {
        var completeSpy, findSpy;
        completeSpy = jasmine.createSpy('did-complete-search');
        findSpy = jasmine.createSpy('did-find-matches');
        search.onDidCompleteSearch(completeSpy);
        search.onDidFindMatches(findSpy);
        search.search();
        waitsFor(function() {
          return completeSpy.callCount > 0;
        });
        return runs(function() {
          expect(findSpy.callCount).toEqual(7);
          return expect(findSpy.argsForCall[0][0].matches.length).toEqual(3);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9jb2xvci1zZWFyY2gtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE9BQUEsQ0FBUSxvQkFBUjs7RUFDQSxXQUFBLEdBQWMsT0FBQSxDQUFRLHFCQUFSOztFQUVkLFFBQUEsQ0FBUyxhQUFULEVBQXdCLFNBQUE7QUFDdEIsUUFBQTtJQUFBLE1BQThCLEVBQTlCLEVBQUMsZUFBRCxFQUFTLGlCQUFULEVBQW1CO0lBRW5CLFVBQUEsQ0FBVyxTQUFBO01BQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHNCQUFoQixFQUF3QyxDQUN0QyxXQURzQyxFQUV0QyxXQUZzQyxDQUF4QztNQUlBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw4QkFBaEIsRUFBZ0QsQ0FDOUMsVUFEOEMsQ0FBaEQ7TUFHQSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsdUJBQWhCLEVBQXlDLENBQ3ZDLG1CQUR1QyxDQUF6QztNQUlBLGVBQUEsQ0FBZ0IsU0FBQTtlQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixVQUE5QixDQUF5QyxDQUFDLElBQTFDLENBQStDLFNBQUMsR0FBRDtVQUNoRSxRQUFBLEdBQVcsR0FBRyxDQUFDO2lCQUNmLE9BQUEsR0FBVSxRQUFRLENBQUMsVUFBVCxDQUFBO1FBRnNELENBQS9DO01BQUgsQ0FBaEI7YUFJQSxlQUFBLENBQWdCLFNBQUE7ZUFBRyxPQUFPLENBQUMsVUFBUixDQUFBO01BQUgsQ0FBaEI7SUFoQlMsQ0FBWDtXQWtCQSxRQUFBLENBQVMsaUNBQVQsRUFBNEMsU0FBQTtNQUMxQyxVQUFBLENBQVcsU0FBQTtlQUNULE1BQUEsR0FBUyxPQUFPLENBQUMsYUFBUixDQUFBO01BREEsQ0FBWDtNQUdBLEVBQUEsQ0FBRyw2REFBSCxFQUFrRSxTQUFBO0FBQ2hFLFlBQUE7UUFBQSxHQUFBLEdBQU0sT0FBTyxDQUFDLFNBQVIsQ0FBa0IscUJBQWxCO1FBQ04sTUFBTSxDQUFDLG1CQUFQLENBQTJCLEdBQTNCO1FBQ0EsTUFBTSxDQUFDLE1BQVAsQ0FBQTtRQUNBLFFBQUEsQ0FBUyxTQUFBO2lCQUFHLEdBQUcsQ0FBQyxTQUFKLEdBQWdCO1FBQW5CLENBQVQ7ZUFDQSxJQUFBLENBQUssU0FBQTtpQkFBRyxNQUFBLENBQU8sR0FBRyxDQUFDLFdBQVksQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUE3QixDQUFvQyxDQUFDLE9BQXJDLENBQTZDLEVBQTdDO1FBQUgsQ0FBTDtNQUxnRSxDQUFsRTthQU9BLEVBQUEsQ0FBRyxvREFBSCxFQUF5RCxTQUFBO0FBQ3ZELFlBQUE7UUFBQSxXQUFBLEdBQWMsT0FBTyxDQUFDLFNBQVIsQ0FBa0IscUJBQWxCO1FBQ2QsT0FBQSxHQUFVLE9BQU8sQ0FBQyxTQUFSLENBQWtCLGtCQUFsQjtRQUNWLE1BQU0sQ0FBQyxtQkFBUCxDQUEyQixXQUEzQjtRQUNBLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixPQUF4QjtRQUNBLE1BQU0sQ0FBQyxNQUFQLENBQUE7UUFDQSxRQUFBLENBQVMsU0FBQTtpQkFBRyxXQUFXLENBQUMsU0FBWixHQUF3QjtRQUEzQixDQUFUO2VBQ0EsSUFBQSxDQUFLLFNBQUE7VUFDSCxNQUFBLENBQU8sT0FBTyxDQUFDLFNBQWYsQ0FBeUIsQ0FBQyxPQUExQixDQUFrQyxDQUFsQztpQkFDQSxNQUFBLENBQU8sT0FBTyxDQUFDLFdBQVksQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxPQUFPLENBQUMsTUFBekMsQ0FBZ0QsQ0FBQyxPQUFqRCxDQUF5RCxDQUF6RDtRQUZHLENBQUw7TUFQdUQsQ0FBekQ7SUFYMEMsQ0FBNUM7RUFyQnNCLENBQXhCO0FBSEEiLCJzb3VyY2VzQ29udGVudCI6WyJyZXF1aXJlICcuL2hlbHBlcnMvbWF0Y2hlcnMnXG5Db2xvclNlYXJjaCA9IHJlcXVpcmUgJy4uL2xpYi9jb2xvci1zZWFyY2gnXG5cbmRlc2NyaWJlICdDb2xvclNlYXJjaCcsIC0+XG4gIFtzZWFyY2gsIHBpZ21lbnRzLCBwcm9qZWN0XSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGF0b20uY29uZmlnLnNldCAncGlnbWVudHMuc291cmNlTmFtZXMnLCBbXG4gICAgICAnKiovKi5zdHlsJ1xuICAgICAgJyoqLyoubGVzcydcbiAgICBdXG4gICAgYXRvbS5jb25maWcuc2V0ICdwaWdtZW50cy5leHRlbmRlZFNlYXJjaE5hbWVzJywgW1xuICAgICAgJyoqLyouY3NzJ1xuICAgIF1cbiAgICBhdG9tLmNvbmZpZy5zZXQgJ3BpZ21lbnRzLmlnbm9yZWROYW1lcycsIFtcbiAgICAgICdwcm9qZWN0L3ZlbmRvci8qKidcbiAgICBdXG5cbiAgICB3YWl0c0ZvclByb21pc2UgLT4gYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ3BpZ21lbnRzJykudGhlbiAocGtnKSAtPlxuICAgICAgcGlnbWVudHMgPSBwa2cubWFpbk1vZHVsZVxuICAgICAgcHJvamVjdCA9IHBpZ21lbnRzLmdldFByb2plY3QoKVxuXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+IHByb2plY3QuaW5pdGlhbGl6ZSgpXG5cbiAgZGVzY3JpYmUgJ3doZW4gY3JlYXRlZCB3aXRoIGJhc2ljIG9wdGlvbnMnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNlYXJjaCA9IHByb2plY3QuZmluZEFsbENvbG9ycygpXG5cbiAgICBpdCAnZGlzcGF0Y2hlcyBhIGRpZC1jb21wbGV0ZS1zZWFyY2ggd2hlbiBmaW5hbGl6aW5nIGl0cyBzZWFyY2gnLCAtPlxuICAgICAgc3B5ID0gamFzbWluZS5jcmVhdGVTcHkoJ2RpZC1jb21wbGV0ZS1zZWFyY2gnKVxuICAgICAgc2VhcmNoLm9uRGlkQ29tcGxldGVTZWFyY2goc3B5KVxuICAgICAgc2VhcmNoLnNlYXJjaCgpXG4gICAgICB3YWl0c0ZvciAtPiBzcHkuY2FsbENvdW50ID4gMFxuICAgICAgcnVucyAtPiBleHBlY3Qoc3B5LmFyZ3NGb3JDYWxsWzBdWzBdLmxlbmd0aCkudG9FcXVhbCgyNilcblxuICAgIGl0ICdkaXNwYXRjaGVzIGEgZGlkLWZpbmQtbWF0Y2hlcyBldmVudCBmb3IgZXZlcnkgZmlsZScsIC0+XG4gICAgICBjb21wbGV0ZVNweSA9IGphc21pbmUuY3JlYXRlU3B5KCdkaWQtY29tcGxldGUtc2VhcmNoJylcbiAgICAgIGZpbmRTcHkgPSBqYXNtaW5lLmNyZWF0ZVNweSgnZGlkLWZpbmQtbWF0Y2hlcycpXG4gICAgICBzZWFyY2gub25EaWRDb21wbGV0ZVNlYXJjaChjb21wbGV0ZVNweSlcbiAgICAgIHNlYXJjaC5vbkRpZEZpbmRNYXRjaGVzKGZpbmRTcHkpXG4gICAgICBzZWFyY2guc2VhcmNoKClcbiAgICAgIHdhaXRzRm9yIC0+IGNvbXBsZXRlU3B5LmNhbGxDb3VudCA+IDBcbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgZXhwZWN0KGZpbmRTcHkuY2FsbENvdW50KS50b0VxdWFsKDcpXG4gICAgICAgIGV4cGVjdChmaW5kU3B5LmFyZ3NGb3JDYWxsWzBdWzBdLm1hdGNoZXMubGVuZ3RoKS50b0VxdWFsKDMpXG4iXX0=
