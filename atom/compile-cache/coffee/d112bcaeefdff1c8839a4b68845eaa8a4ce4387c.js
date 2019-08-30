(function() {
  var _updateWindowTitle;

  _updateWindowTitle = null;

  module.exports = {
    configDefaults: {
      template: '<%= fileName %><% if (projectPath) { %> - <%= projectPath %><% } %>'
    },
    config: {
      template: {
        type: 'string',
        "default": '<%= fileName %><% if (projectPath) { %> - <%= projectPath %><% } %>'
      }
    },
    subscriptions: null,
    configSub: null,
    activate: function(state) {
      var CompositeDisposable, _, allowUnsafeNewFunction, path, template;
      _ = require('underscore');
      allowUnsafeNewFunction = require('loophole').allowUnsafeNewFunction;
      path = require('path');
      CompositeDisposable = require('event-kit').CompositeDisposable;
      this.subscriptions = new CompositeDisposable;
      template = null;
      this.configSub = atom.config.observe('custom-title.template', function() {
        var e, templateString;
        templateString = atom.config.get('custom-title.template');
        if (templateString) {
          try {
            template = allowUnsafeNewFunction(function() {
              return _.template(templateString);
            });
          } catch (error) {
            e = error;
            template = null;
          }
        } else {
          template = null;
        }
        return atom.workspace.updateWindowTitle();
      });
      _updateWindowTitle = atom.workspace.updateWindowTitle;
      atom.workspace.updateWindowTitle = function() {
        var devMode, e, fileInProject, fileName, filePath, gitAdded, gitDeleted, gitHead, item, projectName, projectPath, ref, relativeFilePath, repo, safeMode, stats, status, title;
        if (template) {
          projectPath = atom.project.getPaths()[0];
          projectName = projectPath ? path.basename(projectPath) : null;
          item = atom.workspace.getActivePaneItem();
          fileName = (ref = item != null ? typeof item.getTitle === "function" ? item.getTitle() : void 0 : void 0) != null ? ref : 'untitled';
          filePath = item != null ? typeof item.getPath === "function" ? item.getPath() : void 0 : void 0;
          fileInProject = false;
          repo = atom.project.getRepositories()[0];
          gitHead = repo != null ? repo.getShortHead() : void 0;
          gitAdded = null;
          gitDeleted = null;
          relativeFilePath = null;
          devMode = atom.inDevMode();
          safeMode = typeof atom.inSafeMode === "function" ? atom.inSafeMode() : void 0;
          if (filePath && repo) {
            status = repo.getCachedPathStatus(filePath);
            if (repo.isStatusModified(status)) {
              stats = repo.getDiffStats(filePath);
              gitAdded = stats.added;
              gitDeleted = stats.deleted;
            } else if (repo.isStatusNew(status)) {
              gitAdded = typeof item.getBuffer === "function" ? item.getBuffer().getLineCount() : void 0;
              gitDeleted = 0;
            } else {
              gitAdded = gitDeleted = 0;
            }
          }
          if (filePath && projectPath) {
            relativeFilePath = path.relative(projectPath, filePath);
            if (filePath.startsWith(projectPath)) {
              fileInProject = true;
            }
          }
          try {
            title = template({
              projectPath: projectPath,
              projectName: projectName,
              fileInProject: fileInProject,
              filePath: filePath,
              relativeFilePath: relativeFilePath,
              fileName: fileName,
              gitHead: gitHead,
              gitAdded: gitAdded,
              gitDeleted: gitDeleted,
              devMode: devMode,
              safeMode: safeMode
            });
            if (filePath || projectPath) {
              atom.setRepresentedFilename(filePath != null ? filePath : projectPath);
            }
            return document.title = title;
          } catch (error) {
            e = error;
            return _updateWindowTitle.call(this);
          }
        } else {
          return _updateWindowTitle.call(this);
        }
      };
      atom.workspace.updateWindowTitle();
      return this.subscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          var editorSubscriptions;
          editorSubscriptions = new CompositeDisposable;
          editorSubscriptions.add(editor.onDidSave(function() {
            return atom.workspace.updateWindowTitle();
          }));
          editorSubscriptions.add(editor.onDidDestroy(function() {
            return editorSubscriptions.dispose();
          }));
          return _this.subscriptions.add(editorSubscriptions);
        };
      })(this)));
    },
    deactivate: function() {
      var ref, ref1;
      if ((ref = this.subscriptions) != null) {
        ref.dispose();
      }
      if ((ref1 = this.configSub) != null) {
        ref1.dispose();
      }
      return atom.workspace.updateWindowTitle = _updateWindowTitle;
    },
    serialize: function() {}
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvY3VzdG9tLXRpdGxlL2xpYi9jdXN0b20tdGl0bGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxrQkFBQSxHQUFxQjs7RUFFckIsTUFBTSxDQUFDLE9BQVAsR0FDQztJQUFBLGNBQUEsRUFDQztNQUFBLFFBQUEsRUFBVSxxRUFBVjtLQUREO0lBR0EsTUFBQSxFQUNDO01BQUEsUUFBQSxFQUNDO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLHFFQURUO09BREQ7S0FKRDtJQVFBLGFBQUEsRUFBZSxJQVJmO0lBU0EsU0FBQSxFQUFXLElBVFg7SUFXQSxRQUFBLEVBQVUsU0FBQyxLQUFEO0FBQ1QsVUFBQTtNQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsWUFBUjtNQUNGLHlCQUEyQixPQUFBLENBQVEsVUFBUjtNQUM3QixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7TUFDTixzQkFBdUIsT0FBQSxDQUFRLFdBQVI7TUFFeEIsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUVyQixRQUFBLEdBQVc7TUFFWCxJQUFDLENBQUEsU0FBRCxHQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQix1QkFBcEIsRUFBNkMsU0FBQTtBQUN6RCxZQUFBO1FBQUEsY0FBQSxHQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsdUJBQWhCO1FBRWpCLElBQUcsY0FBSDtBQUNDO1lBQ0MsUUFBQSxHQUFXLHNCQUFBLENBQXVCLFNBQUE7cUJBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxjQUFYO1lBQUgsQ0FBdkIsRUFEWjtXQUFBLGFBQUE7WUFFTTtZQUNMLFFBQUEsR0FBVyxLQUhaO1dBREQ7U0FBQSxNQUFBO1VBTUMsUUFBQSxHQUFXLEtBTlo7O2VBUUEsSUFBSSxDQUFDLFNBQVMs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SCxDQUFqQixDQUF4QjtVQUNBLG1CQUFtQixDQUFDLEdBQXBCLENBQXdCLE1BQU0sQ0FBQyxZQUFQLENBQW9CLFNBQUE7bUJBQUcsbUJBQW1CLENBQUMsT0FBcEIsQ0FBQTtVQUFILENBQXBCLENBQXhCO2lCQUVBLEtBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixtQkFBbkI7UUFMb0Q7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxDLENBQW5CO0lBbEZTLENBWFY7SUFxR0EsVUFBQSxFQUFZLFNBQUE7QUFDWCxVQUFBOztXQUFjLENBQUUsT0FBaEIsQ0FBQTs7O1lBQ1UsQ0FBRSxPQUFaLENBQUE7O2FBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBZixHQUFtQztJQUh4QixDQXJHWjtJQTBHQSxTQUFBLEVBQVcsU0FBQSxHQUFBLENBMUdYOztBQUhEIiwic291cmNlc0NvbnRlbnQiOlsiX3VwZGF0ZVdpbmRvd1RpdGxlID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cdGNvbmZpZ0RlZmF1bHRzOlxuXHRcdHRlbXBsYXRlOiAnPCU9IGZpbGVOYW1lICU+PCUgaWYgKHByb2plY3RQYXRoKSB7ICU+IC0gPCU9IHByb2plY3RQYXRoICU+PCUgfSAlPidcblxuXHRjb25maWc6XG5cdFx0dGVtcGxhdGU6XG5cdFx0XHR0eXBlOiAnc3RyaW5nJ1xuXHRcdFx0ZGVmYXVsdDogJzwlPSBmaWxlTmFtZSAlPjwlIGlmIChwcm9qZWN0UGF0aCkgeyAlPiAtIDwlPSBwcm9qZWN0UGF0aCAlPjwlIH0gJT4nXG5cblx0c3Vic2NyaXB0aW9uczogbnVsbFxuXHRjb25maWdTdWI6IG51bGxcblxuXHRhY3RpdmF0ZTogKHN0YXRlKSAtPlxuXHRcdF8gPSByZXF1aXJlICd1bmRlcnNjb3JlJ1xuXHRcdHsgYWxsb3dVbnNhZmVOZXdGdW5jdGlvbiB9ID0gcmVxdWlyZSAnbG9vcGhvbGUnXG5cdFx0cGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cdFx0e0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnZXZlbnQta2l0J1xuXG5cdFx0QHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG5cdFx0dGVtcGxhdGUgPSBudWxsXG5cblx0XHRAY29uZmlnU3ViID0gYXRvbS5jb25maWcub2JzZXJ2ZSAnY3VzdG9tLXRpdGxlLnRlbXBsYXRlJywgLT5cblx0XHRcdHRlbXBsYXRlU3RyaW5nID0gYXRvbS5jb25maWcuZ2V0KCdjdXN0b20tdGl0bGUudGVtcGxhdGUnKVxuXG5cdFx0XHRpZiB0ZW1wbGF0ZVN0cmluZ1xuXHRcdFx0XHR0cnlcblx0XHRcdFx0XHR0ZW1wbGF0ZSA9IGFsbG93VW5zYWZlTmV3RnVuY3Rpb24gLT4gXy50ZW1wbGF0ZSB0ZW1wbGF0ZVN0cmluZ1xuXHRcdFx0XHRjYXRjaCBlXG5cdFx0XHRcdFx0dGVtcGxhdGUgPSBudWxsXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRlbXBsYXRlID0gbnVsbFxuXG5cdFx0XHRhdG9tLndvcmtzcGFjZS51cGRhdGVXaW5kb3dUaXRsZSgpXG5cblx0XHRfdXBkYXRlV2luZG93VGl0bGUgPSBhdG9tLndvcmtzcGFjZS51cGRhdGVXaW5kb3dUaXRsZVxuXG5cdFx0YXRvbS53b3Jrc3BhY2UudXBkYXRlV2luZG93VGl0bGUgPSAtPlxuXHRcdFx0aWYgdGVtcGxhdGVcblx0XHRcdFx0cHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXVxuXHRcdFx0XHRwcm9qZWN0TmFtZSA9IGlmIHByb2plY3RQYXRoIHRoZW4gcGF0aC5iYXNlbmFtZShwcm9qZWN0UGF0aCkgZWxzZSBudWxsXG5cblx0XHRcdFx0aXRlbSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKClcblxuXHRcdFx0XHRmaWxlTmFtZSA9IGl0ZW0/LmdldFRpdGxlPygpID8gJ3VudGl0bGVkJ1xuXHRcdFx0XHRmaWxlUGF0aCA9IGl0ZW0/LmdldFBhdGg/KClcblx0XHRcdFx0ZmlsZUluUHJvamVjdCA9IGZhbHNlXG5cblx0XHRcdFx0cmVwbyA9IGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKVswXVxuXHRcdFx0XHRnaXRIZWFkID0gcmVwbz8uZ2V0U2hvcnRIZWFkKClcblxuXHRcdFx0XHRnaXRBZGRlZCA9IG51bGxcblx0XHRcdFx0Z2l0RGVsZXRlZCA9IG51bGxcblx0XHRcdFx0cmVsYXRpdmVGaWxlUGF0aCA9IG51bGxcblxuXHRcdFx0XHRkZXZNb2RlID0gYXRvbS5pbkRldk1vZGUoKVxuXHRcdFx0XHRzYWZlTW9kZSA9IGF0b20uaW5TYWZlTW9kZT8oKVxuXG5cdFx0XHRcdGlmIGZpbGVQYXRoIGFuZCByZXBvXG5cdFx0XHRcdFx0c3RhdHVzID0gcmVwby5nZXRDYWNoZWRQYXRoU3RhdHVzKGZpbGVQYXRoKVxuXHRcdFx0XHRcdGlmIHJlcG8uaXNTdGF0dXNNb2RpZmllZChzdGF0dXMpXG5cdFx0XHRcdFx0XHRzdGF0cyA9IHJlcG8uZ2V0RGlmZlN0YXRzKGZpbGVQYXRoKVxuXHRcdFx0XHRcdFx0Z2l0QWRkZWQgPSBzdGF0cy5hZGRlZFxuXHRcdFx0XHRcdFx0Z2l0RGVsZXRlZCA9IHN0YXRzLmRlbGV0ZWRcblx0XHRcdFx0XHRlbHNlIGlmIHJlcG8uaXNTdGF0dXNOZXcoc3RhdHVzKVxuXHRcdFx0XHRcdFx0Z2l0QWRkZWQgPSBpdGVtLmdldEJ1ZmZlcj8oKS5nZXRMaW5lQ291bnQoKVxuXHRcdFx0XHRcdFx0Z2l0RGVsZXRlZCA9IDBcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRnaXRBZGRlZCA9IGdpdERlbGV0ZWQgPSAwXG5cblx0XHRcdFx0aWYgZmlsZVBhdGggYW5kIHByb2plY3RQYXRoXG5cdFx0XHRcdFx0cmVsYXRpdmVGaWxlUGF0aCA9IHBhdGgucmVsYXRpdmUocHJvamVjdFBhdGgsIGZpbGVQYXRoKVxuXHRcdFx0XHRcdGlmIGZpbGVQYXRoLnN0YXJ0c1dpdGgocHJvamVjdFBhdGgpXG5cdFx0XHRcdFx0XHRmaWxlSW5Qcm9qZWN0ID0gdHJ1ZVxuXG5cdFx0XHRcdHRyeVxuXG5cdFx0XHRcdFx0dGl0bGUgPSB0ZW1wbGF0ZSB7XG5cdFx0XHRcdFx0XHRwcm9qZWN0UGF0aCwgcHJvamVjdE5hbWUsIGZpbGVJblByb2plY3QsXG5cdFx0XHRcdFx0XHRmaWxlUGF0aCwgcmVsYXRpdmVGaWxlUGF0aCwgZmlsZU5hbWUsXG5cdFx0XHRcdFx0XHRnaXRIZWFkLCBnaXRBZGRlZCwgZ2l0RGVsZXRlZFxuXHRcdFx0XHRcdFx0ZGV2TW9kZSwgc2FmZU1vZGVcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiBmaWxlUGF0aCBvciBwcm9qZWN0UGF0aFxuXHRcdFx0XHRcdFx0YXRvbS5zZXRSZXByZXNlbnRlZEZpbGVuYW1lKGZpbGVQYXRoID8gcHJvamVjdFBhdGgpXG5cdFx0XHRcdFx0ZG9jdW1lbnQudGl0bGUgPSB0aXRsZVxuXHRcdFx0XHRjYXRjaCBlXG5cdFx0XHRcdFx0X3VwZGF0ZVdpbmRvd1RpdGxlLmNhbGwodGhpcylcblx0XHRcdGVsc2Vcblx0XHRcdFx0X3VwZGF0ZVdpbmRvd1RpdGxlLmNhbGwodGhpcylcblxuXHRcdGF0b20ud29ya3NwYWNlLnVwZGF0ZVdpbmRvd1RpdGxlKClcblxuXHRcdEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cblx0XHRcdGVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXHRcdFx0ZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQgZWRpdG9yLm9uRGlkU2F2ZSAtPiBhdG9tLndvcmtzcGFjZS51cGRhdGVXaW5kb3dUaXRsZSgpXG5cdFx0XHRlZGl0b3JTdWJzY3JpcHRpb25zLmFkZCBlZGl0b3Iub25EaWREZXN0cm95IC0+IGVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cblx0XHRcdEBzdWJzY3JpcHRpb25zLmFkZCBlZGl0b3JTdWJzY3JpcHRpb25zXG5cblxuXHRkZWFjdGl2YXRlOiAtPlxuXHRcdEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcblx0XHRAY29uZmlnU3ViPy5kaXNwb3NlKClcblx0XHRhdG9tLndvcmtzcGFjZS51cGRhdGVXaW5kb3dUaXRsZSA9IF91cGRhdGVXaW5kb3dUaXRsZVxuXG5cdHNlcmlhbGl6ZTogLT5cbiJdfQ==
