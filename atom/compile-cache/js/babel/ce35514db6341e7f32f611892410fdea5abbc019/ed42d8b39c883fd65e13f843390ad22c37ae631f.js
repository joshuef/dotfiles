Object.defineProperty(exports, '__esModule', {
    value: true
});

var _atom = require('atom');

// Modified from
// https://github.com/chrw/atom-hclfmt/blob/188d119bb6f6ab1996beaa57860343b93a57705b/lib/hclfmt.js
'use babel';

exports['default'] = {
    config: {
        fmtOnSave: {
            type: 'boolean',
            'default': true,
            title: 'Format on save'
        },
        binPath: {
            type: 'string',
            'default': 'terraform',
            title: 'Path to the terraform executable'
        }
    },

    activate: function activate(state) {
        var _this = this;

        this.subscriptions = new _atom.CompositeDisposable();

        this.subscriptions.add(atom.workspace.observeTextEditors(function (textEditor) {
            _this.subscriptions.add(textEditor.onDidSave(function (event) {
                if (textEditor.getGrammar().scopeName != 'source.terraform') return;
                if (!atom.config.get('terraform-fmt.fmtOnSave')) return;
                _this.format(event.path);
            }));
        }));

        this.subscriptions.add(atom.commands.add('atom-text-editor[data-grammar~="Terraform"]', 'terraform-fmt:format', function () {
            var textEditor = atom.workspace.getActiveTextEditor();
            if (textEditor.getGrammar().scopeName != 'source.terraform') return;
            textEditor.save();
            if (!atom.config.get('terraform-fmt.fmtOnSave')) {
                _this.format(textEditor.getPath());
            }
        }));
    },

    deactivate: function deactivate() {
        this.subscriptions.dispose();
    },

    format: function format(file) {
        new _atom.BufferedProcess({ command: atom.config.get('terraform-fmt.binPath'), args: ['fmt', file] });
    }

};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvdGVycmFmb3JtLWZtdC9saWIvdGVycmFmb3JtLWZtdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O29CQUVxRCxNQUFNOzs7O0FBRjNELFdBQVcsQ0FBQzs7cUJBTUc7QUFDWCxVQUFNLEVBQUU7QUFDSixpQkFBUyxFQUFFO0FBQ1AsZ0JBQUksRUFBRSxTQUFTO0FBQ2YsdUJBQVMsSUFBSTtBQUNiLGlCQUFLLEVBQUUsZ0JBQWdCO1NBQzFCO0FBQ0QsZUFBTyxFQUFFO0FBQ0wsZ0JBQUksRUFBRSxRQUFRO0FBQ2QsdUJBQVMsV0FBVztBQUNwQixpQkFBSyxFQUFFLGtDQUFrQztTQUM1QztLQUNKOztBQUVELFlBQVEsRUFBQSxrQkFBQyxLQUFLLEVBQUU7OztBQUNaLFlBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUM7O0FBRS9DLFlBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsVUFBQyxVQUFVLEVBQUs7QUFDckUsa0JBQUssYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQUMsS0FBSyxFQUFLO0FBQ25ELG9CQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLElBQUksa0JBQWtCLEVBQUUsT0FBTztBQUNwRSxvQkFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLEVBQUUsT0FBTztBQUN4RCxzQkFBSyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzNCLENBQUMsQ0FBQyxDQUFDO1NBQ1AsQ0FBQyxDQUFDLENBQUM7O0FBRUosWUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsNkNBQTZDLEVBQUUsc0JBQXNCLEVBQUUsWUFBTTtBQUNsSCxnQkFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3RELGdCQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLElBQUksa0JBQWtCLEVBQUUsT0FBTztBQUNwRSxzQkFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2xCLGdCQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsRUFBRTtBQUM3QyxzQkFBSyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7YUFDckM7U0FDSixDQUFDLENBQUMsQ0FBQztLQUNQOztBQUVELGNBQVUsRUFBQSxzQkFBRztBQUNULFlBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDaEM7O0FBRUQsVUFBTSxFQUFBLGdCQUFDLElBQUksRUFBRTtBQUNULGtDQUFvQixFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBQyxDQUFDLENBQUM7S0FDakc7O0NBRUoiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy90ZXJyYWZvcm0tZm10L2xpYi90ZXJyYWZvcm0tZm10LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIEJ1ZmZlcmVkUHJvY2VzcyB9IGZyb20gJ2F0b20nO1xuXG4vLyBNb2RpZmllZCBmcm9tXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY2hydy9hdG9tLWhjbGZtdC9ibG9iLzE4OGQxMTliYjZmNmFiMTk5NmJlYWE1Nzg2MDM0M2I5M2E1NzcwNWIvbGliL2hjbGZtdC5qc1xuZXhwb3J0IGRlZmF1bHQge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBmbXRPblNhdmU6IHtcbiAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICB0aXRsZTogJ0Zvcm1hdCBvbiBzYXZlJ1xuICAgICAgICB9LFxuICAgICAgICBiaW5QYXRoOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIGRlZmF1bHQ6ICd0ZXJyYWZvcm0nLFxuICAgICAgICAgICAgdGl0bGU6ICdQYXRoIHRvIHRoZSB0ZXJyYWZvcm0gZXhlY3V0YWJsZSdcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhY3RpdmF0ZShzdGF0ZSkge1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKCh0ZXh0RWRpdG9yKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRleHRFZGl0b3Iub25EaWRTYXZlKChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0ZXh0RWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUgIT0gJ3NvdXJjZS50ZXJyYWZvcm0nKSByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKCFhdG9tLmNvbmZpZy5nZXQoJ3RlcnJhZm9ybS1mbXQuZm10T25TYXZlJykpIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdChldmVudC5wYXRoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3JbZGF0YS1ncmFtbWFyfj1cIlRlcnJhZm9ybVwiXScsICd0ZXJyYWZvcm0tZm10OmZvcm1hdCcsICgpID0+IHtcbiAgICAgICAgICAgIGxldCB0ZXh0RWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgaWYgKHRleHRFZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSAhPSAnc291cmNlLnRlcnJhZm9ybScpIHJldHVybjtcbiAgICAgICAgICAgIHRleHRFZGl0b3Iuc2F2ZSgpO1xuICAgICAgICAgICAgaWYgKCFhdG9tLmNvbmZpZy5nZXQoJ3RlcnJhZm9ybS1mbXQuZm10T25TYXZlJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdCh0ZXh0RWRpdG9yLmdldFBhdGgoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9LFxuXG4gICAgZGVhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICB9LFxuXG4gICAgZm9ybWF0KGZpbGUpIHtcbiAgICAgICAgbmV3IEJ1ZmZlcmVkUHJvY2Vzcyh7Y29tbWFuZDogYXRvbS5jb25maWcuZ2V0KCd0ZXJyYWZvcm0tZm10LmJpblBhdGgnKSwgYXJnczogWydmbXQnLCBmaWxlXX0pO1xuICAgIH1cblxufTtcbiJdfQ==