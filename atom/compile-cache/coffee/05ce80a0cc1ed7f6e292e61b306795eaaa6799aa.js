(function() {
  var FtpHost, Host, HostView, HostsView, InterProcessDataWatcher, LocalFile, OpenFilesView, Q, RemoteEditEditor, SftpHost, _, fs, url;

  _ = require('underscore-plus');

  RemoteEditEditor = require('./model/remote-edit-editor');

  OpenFilesView = null;

  HostView = null;

  HostsView = null;

  Host = null;

  SftpHost = null;

  FtpHost = null;

  LocalFile = null;

  url = null;

  Q = null;

  InterProcessDataWatcher = null;

  fs = null;

  module.exports = {
    config: {
      showHiddenFiles: {
        title: 'Show hidden files',
        type: 'boolean',
        "default": false
      },
      uploadOnSave: {
        title: 'Upload on save',
        description: 'When enabled, remote files will be automatically uploaded when saved',
        type: 'boolean',
        "default": true
      },
      notifications: {
        title: 'Display notifications',
        type: 'boolean',
        "default": true
      },
      sshPrivateKeyPath: {
        title: 'Path to private SSH key',
        type: 'string',
        "default": '~/.ssh/id_rsa'
      },
      defaultSerializePath: {
        title: 'Default path to serialize remoteEdit data',
        type: 'string',
        "default": '~/.atom/remoteEdit.json'
      },
      agentToUse: {
        title: 'SSH agent',
        description: 'Overrides default SSH agent. See ssh2 docs for more info.',
        type: 'string',
        "default": 'Default'
      },
      foldersOnTop: {
        title: 'Show folders on top',
        type: 'boolean',
        "default": false
      },
      followLinks: {
        title: 'Follow symbolic links',
        description: 'If set to true, symbolic links are treated as directories',
        type: 'boolean',
        "default": true
      },
      clearFileList: {
        title: 'Clear file list',
        description: 'When enabled, the open files list will be cleared on initialization',
        type: 'boolean',
        "default": false
      },
      rememberLastOpenDirectory: {
        title: 'Remember last open directory',
        description: 'When enabled, browsing a host will return you to the last directory you entered',
        type: 'boolean',
        "default": false
      },
      storePasswordsUsingKeytar: {
        title: 'Store passwords using node-keytar',
        description: 'When enabled, passwords and passphrases will be stored in system\'s keychain',
        type: 'boolean',
        "default": false
      },
      filterHostsUsing: {
        type: 'object',
        properties: {
          hostname: {
            type: 'boolean',
            "default": true
          },
          alias: {
            type: 'boolean',
            "default": false
          },
          username: {
            type: 'boolean',
            "default": false
          },
          port: {
            type: 'boolean',
            "default": false
          }
        }
      }
    },
    activate: function(state) {
      this.setupOpeners();
      this.initializeIpdwIfNecessary();
      atom.commands.add('atom-workspace', 'remote-edit:show-open-files', (function(_this) {
        return function() {
          return _this.showOpenFiles();
        };
      })(this));
      atom.commands.add('atom-workspace', 'remote-edit:browse', (function(_this) {
        return function() {
          return _this.browse();
        };
      })(this));
      atom.commands.add('atom-workspace', 'remote-edit:new-host-sftp', (function(_this) {
        return function() {
          return _this.newHostSftp();
        };
      })(this));
      return atom.commands.add('atom-workspace', 'remote-edit:new-host-ftp', (function(_this) {
        return function() {
          return _this.newHostFtp();
        };
      })(this));
    },
    deactivate: function() {
      var ref;
      return (ref = this.ipdw) != null ? ref.destroy() : void 0;
    },
    newHostSftp: function() {
      var host, view;
      if (HostView == null) {
        HostView = require('./view/host-view');
      }
      if (SftpHost == null) {
        SftpHost = require('./model/sftp-host');
      }
      host = new SftpHost();
      view = new HostView(host, this.getOrCreateIpdw());
      return view.toggle();
    },
    newHostFtp: function() {
      var host, view;
      if (HostView == null) {
        HostView = require('./view/host-view');
      }
      if (FtpHost == null) {
        FtpHost = require('./model/ftp-host');
      }
      host = new FtpHost();
      view = new HostView(host, this.getOrCreateIpdw());
      return view.toggle();
    },
    browse: function() {
      var view;
      if (HostsView == null) {
        HostsView = require('./view/hosts-view');
      }
      view = new HostsView(this.getOrCreateIpdw());
      return view.toggle();
    },
    showOpenFiles: function() {
      var showOpenFilesView;
      if (OpenFilesView == null) {
        OpenFilesView = require('./view/open-files-view');
      }
      showOpenFilesView = new OpenFilesView(this.getOrCreateIpdw());
      return showOpenFilesView.toggle();
    },
    initializeIpdwIfNecessary: function() {
      var editor, i, len, ref, results, stop;
      if (atom.config.get('remote-edit.notifications')) {
        stop = false;
        ref = atom.workspace.getTextEditors();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          editor = ref[i];
          if (!stop) {
            if (editor instanceof RemoteEditEditor) {
              this.getOrCreateIpdw();
              results.push(stop = true);
            } else {
              results.push(void 0);
            }
          }
        }
        return results;
      }
    },
    getOrCreateIpdw: function() {
      if (this.ipdw === void 0) {
        if (InterProcessDataWatcher == null) {
          InterProcessDataWatcher = require('./model/inter-process-data-watcher');
        }
        fs = require('fs-plus');
        return this.ipdw = new InterProcessDataWatcher(fs.absolute(atom.config.get('remote-edit.defaultSerializePath')));
      } else {
        return this.ipdw;
      }
    },
    setupOpeners: function() {
      return atom.workspace.addOpener(function(uriToOpen) {
        var error, host, localFile, protocol, query, ref;
        if (url == null) {
          url = require('url');
        }
        try {
          ref = url.parse(uriToOpen, true), protocol = ref.protocol, host = ref.host, query = ref.query;
        } catch (error1) {
          error = error1;
          return;
        }
        if (protocol !== 'remote-edit:') {
          return;
        }
        if (host === 'localfile') {
          if (Q == null) {
            Q = require('q');
          }
          if (Host == null) {
            Host = require('./model/host');
          }
          if (FtpHost == null) {
            FtpHost = require('./model/ftp-host');
          }
          if (SftpHost == null) {
            SftpHost = require('./model/sftp-host');
          }
          if (LocalFile == null) {
            LocalFile = require('./model/local-file');
          }
          localFile = LocalFile.deserialize(JSON.parse(decodeURIComponent(query.localFile)));
          host = Host.deserialize(JSON.parse(decodeURIComponent(query.host)));
          return atom.project.bufferForPath(localFile.path).then(function(buffer) {
            var editor, params, ws;
            params = {
              buffer: buffer,
              registerEditor: true,
              host: host,
              localFile: localFile
            };
            ws = atom.workspace;
            params = _.extend({
              config: ws.config,
              notificationManager: ws.notificationManager,
              packageManager: ws.packageManager,
              clipboard: ws.clipboard,
              viewRegistry: ws.viewRegistry,
              grammarRegistry: ws.grammarRegistry,
              project: ws.project,
              assert: ws.assert,
              applicationDelegate: ws.applicationDelegate
            }, params);
            return editor = new RemoteEditEditor(params);
          });
        }
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9yZW1vdGUtZWRpdC9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosZ0JBQUEsR0FBbUIsT0FBQSxDQUFRLDRCQUFSOztFQUduQixhQUFBLEdBQWdCOztFQUNoQixRQUFBLEdBQVc7O0VBQ1gsU0FBQSxHQUFZOztFQUNaLElBQUEsR0FBTzs7RUFDUCxRQUFBLEdBQVc7O0VBQ1gsT0FBQSxHQUFVOztFQUNWLFNBQUEsR0FBWTs7RUFDWixHQUFBLEdBQU07O0VBQ04sQ0FBQSxHQUFJOztFQUNKLHVCQUFBLEdBQTBCOztFQUMxQixFQUFBLEdBQUs7O0VBRUwsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLE1BQUEsRUFDRTtNQUFBLGVBQUEsRUFDRTtRQUFBLEtBQUEsRUFBTyxtQkFBUDtRQUNBLElBQUEsRUFBTSxTQUROO1FBRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUZUO09BREY7TUFJQSxZQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sZ0JBQVA7UUFDQSxXQUFBLEVBQWEsc0VBRGI7UUFFQSxJQUFBLEVBQU0sU0FGTjtRQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsSUFIVDtPQUxGO01BU0EsYUFBQSxFQUNFO1FBQUEsS0FBQSxFQUFPLHVCQUFQO1FBQ0EsSUFBQSxFQUFNLFNBRE47UUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRlQ7T0FWRjtNQWFBLGlCQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8seUJBQVA7UUFDQSxJQUFBLEVBQU0sUUFETjtRQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsZUFGVDtPQWRGO01BaUJBLG9CQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sMkNBQVA7UUFDQSxJQUFBLEVBQU0sUUFETjtRQUVBLENBQUEsT0FB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SUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBSSxDQUFDLEtBQUwsQ0FBVyxrQkFBQSxDQUFtQixLQUFLLENBQUMsSUFBekIsQ0FBWCxDQUFqQjtpQkFFUCxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWIsQ0FBMkIsU0FBUyxDQUFDLElBQXJDLENBQTBDLENBQUMsSUFBM0MsQ0FBZ0QsU0FBQyxNQUFEO0FBQzlDLGdCQUFBO1lBQUEsTUFBQSxHQUFTO2NBQUMsTUFBQSxFQUFRLE1BQVQ7Y0FBaUIsY0FBQSxFQUFnQixJQUFqQztjQUF1QyxJQUFBLEVBQU0sSUFBN0M7Y0FBbUQsU0FBQSxFQUFXLFNBQTlEOztZQUVULEVBQUEsR0FBSyxJQUFJLENBQUM7WUFDVixNQUFBLEdBQVMsQ0FBQyxDQUFDLE1BQUYsQ0FBUztjQUNoQixNQUFBLEVBQVEsRUFBRSxDQUFDLE1BREs7Y0FDRyxtQkFBQSxFQUFxQixFQUFFLENBQUMsbUJBRDNCO2NBQ2dELGNBQUEsRUFBZ0IsRUFBRSxDQUFDLGNBRG5FO2NBQ21GLFNBQUEsRUFBVyxFQUFFLENBQUMsU0FEakc7Y0FDNEcsWUFBQSxFQUFjLEVBQUUsQ0FBQyxZQUQ3SDtjQUVoQixlQUFBLEVBQWlCLEVBQUUsQ0FBQyxlQUZKO2NBRXFCLE9BQUEsRUFBUyxFQUFFLENBQUMsT0FGakM7Y0FFMEMsTUFBQSxFQUFRLEVBQUUsQ0FBQyxNQUZyRDtjQUU2RCxtQkFBQSxFQUFxQixFQUFFLENBQUMsbUJBRnJGO2FBQVQsRUFHTixNQUhNO21CQUlULE1BQUEsR0FBUyxJQUFJLGdCQUFKLENBQXFCLE1BQXJCO1VBUnFDLENBQWhELEVBVEY7O01BUnVCLENBQXpCO0lBRFksQ0F4SGQ7O0FBbEJGIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbiMgSW1wb3J0IG5lZWRlZCB0byByZWdpc3RlciBkZXNlcmlhbGl6ZXJcblJlbW90ZUVkaXRFZGl0b3IgPSByZXF1aXJlICcuL21vZGVsL3JlbW90ZS1lZGl0LWVkaXRvcidcblxuIyBEZWZlcnJlZCByZXF1aXJlbWVudHNcbk9wZW5GaWxlc1ZpZXcgPSBudWxsXG5Ib3N0VmlldyA9IG51bGxcbkhvc3RzVmlldyA9IG51bGxcbkhvc3QgPSBudWxsXG5TZnRwSG9zdCA9IG51bGxcbkZ0cEhvc3QgPSBudWxsXG5Mb2NhbEZpbGUgPSBudWxsXG51cmwgPSBudWxsXG5RID0gbnVsbFxuSW50ZXJQcm9jZXNzRGF0YVdhdGNoZXIgPSBudWxsXG5mcyA9IG51bGxcblxubW9kdWxlLmV4cG9ydHMgPVxuICBjb25maWc6XG4gICAgc2hvd0hpZGRlbkZpbGVzOlxuICAgICAgdGl0bGU6ICdTaG93IGhpZGRlbiBmaWxlcydcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICB1cGxvYWRPblNhdmU6XG4gICAgICB0aXRsZTogJ1VwbG9hZCBvbiBzYXZlJ1xuICAgICAgZGVzY3JpcHRpb246ICdXaGVuIGVuYWJsZWQsIHJlbW90ZSBmaWxlcyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgdXBsb2FkZWQgd2hlbiBzYXZlZCdcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgIG5vdGlmaWNhdGlvbnM6XG4gICAgICB0aXRsZTogJ0Rpc3BsYXkgbm90aWZpY2F0aW9ucydcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgIHNzaFByaXZhdGVLZXlQYXRoOlxuICAgICAgdGl0bGU6ICdQYXRoIHRvIHByaXZhdGUgU1NIIGtleSdcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnfi8uc3NoL2lkX3JzYSdcbiAgICBkZWZhdWx0U2VyaWFsaXplUGF0aDpcbiAgICAgIHRpdGxlOiAnRGVmYXVsdCBwYXRoIHRvIHNlcmlhbGl6ZSByZW1vdGVFZGl0IGRhdGEnXG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJ34vLmF0b20vcmVtb3RlRWRpdC5qc29uJ1xuICAgIGFnZW50VG9Vc2U6XG4gICAgICB0aXRsZTogJ1NTSCBhZ2VudCdcbiAgICAgIGRlc2NyaXB0aW9uOiAnT3ZlcnJpZGVzIGRlZmF1bHQgU1NIIGFnZW50LiBTZWUgc3NoMiBkb2NzIGZvciBtb3JlIGluZm8uJ1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICdEZWZhdWx0J1xuICAgIGZvbGRlcnNPblRvcDpcbiAgICAgIHRpdGxlOiAnU2hvdyBmb2xkZXJzIG9uIHRvcCdcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICBmb2xsb3dMaW5rczpcbiAgICAgIHRpdGxlOiAnRm9sbG93IHN5bWJvbGljIGxpbmtzJ1xuICAgICAgZGVzY3JpcHRpb246ICdJZiBzZXQgdG8gdHJ1ZSwgc3ltYm9saWMgbGlua3MgYXJlIHRyZWF0ZWQgYXMgZGlyZWN0b3JpZXMnXG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICBjbGVhckZpbGVMaXN0OlxuICAgICAgdGl0bGU6ICdDbGVhciBmaWxlIGxpc3QnXG4gICAgICBkZXNjcmlwdGlvbjogJ1doZW4gZW5hYmxlZCwgdGhlIG9wZW4gZmlsZXMgbGlzdCB3aWxsIGJlIGNsZWFyZWQgb24gaW5pdGlhbGl6YXRpb24nXG4gICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgcmVtZW1iZXJMYXN0T3BlbkRpcmVjdG9yeTpcbiAgICAgIHRpdGxlOiAnUmVtZW1iZXIgbGFzdCBvcGVuIGRpcmVjdG9yeSdcbiAgICAgIGRlc2NyaXB0aW9uOiAnV2hlbiBlbmFibGVkLCBicm93c2luZyBhIGhvc3Qgd2lsbCByZXR1cm4geW91IHRvIHRoZSBsYXN0IGRpcmVjdG9yeSB5b3UgZW50ZXJlZCdcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICBzdG9yZVBhc3N3b3Jkc1VzaW5nS2V5dGFyOlxuICAgICAgdGl0bGU6ICdTdG9yZSBwYXNzd29yZHMgdXNpbmcgbm9kZS1rZXl0YXInXG4gICAgICBkZXNjcmlwdGlvbjogJ1doZW4gZW5hYmxlZCwgcGFzc3dvcmRzIGFuZCBwYXNzcGhyYXNlcyB3aWxsIGJlIHN0b3JlZCBpbiBzeXN0ZW1cXCdzIGtleWNoYWluJ1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGZpbHRlckhvc3RzVXNpbmc6XG4gICAgICB0eXBlOiAnb2JqZWN0J1xuICAgICAgcHJvcGVydGllczpcbiAgICAgICAgaG9zdG5hbWU6XG4gICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICBhbGlhczpcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICB1c2VybmFtZTpcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbidcbiAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICBwb3J0OlxuICAgICAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG5cblxuICBhY3RpdmF0ZTogKHN0YXRlKSAtPlxuICAgIEBzZXR1cE9wZW5lcnMoKVxuICAgIEBpbml0aWFsaXplSXBkd0lmTmVjZXNzYXJ5KClcblxuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdyZW1vdGUtZWRpdDpzaG93LW9wZW4tZmlsZXMnLCA9PiBAc2hvd09wZW5GaWxlcygpKVxuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICdyZW1vdGUtZWRpdDpicm93c2UnLCA9PiBAYnJvd3NlKCkpXG4gICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ3JlbW90ZS1lZGl0Om5ldy1ob3N0LXNmdHAnLCA9PiBAbmV3SG9zdFNmdHAoKSlcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAncmVtb3RlLWVkaXQ6bmV3LWhvc3QtZnRwJywgPT4gQG5ld0hvc3RGdHAoKSlcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBpcGR3Py5kZXN0cm95KClcblxuICBuZXdIb3N0U2Z0cDogLT5cbiAgICBIb3N0VmlldyA/PSByZXF1aXJlICcuL3ZpZXcvaG9zdC12aWV3J1xuICAgIFNmdHBIb3N0ID89IHJlcXVpcmUgJy4vbW9kZWwvc2Z0cC1ob3N0J1xuICAgIGhvc3QgPSBuZXcgU2Z0cEhvc3QoKVxuICAgIHZpZXcgPSBuZXcgSG9zdFZpZXcoaG9zdCwgQGdldE9yQ3JlYXRlSXBkdygpKVxuICAgIHZpZXcudG9nZ2xlKClcblxuICBuZXdIb3N0RnRwOiAtPlxuICAgIEhvc3RWaWV3ID89IHJlcXVpcmUgJy4vdmlldy9ob3N0LXZpZXcnXG4gICAgRnRwSG9zdCA/PSByZXF1aXJlICcuL21vZGVsL2Z0cC1ob3N0J1xuICAgIGhvc3QgPSBuZXcgRnRwSG9zdCgpXG4gICAgdmlldyA9IG5ldyBIb3N0Vmlldyhob3N0LCBAZ2V0T3JDcmVhdGVJcGR3KCkpXG4gICAgdmlldy50b2dnbGUoKVxuXG4gIGJyb3dzZTogLT5cbiAgICBIb3N0c1ZpZXcgPz0gcmVxdWlyZSAnLi92aWV3L2hvc3RzLXZpZXcnXG4gICAgdmlldyA9IG5ldyBIb3N0c1ZpZXcoQGdldE9yQ3JlYXRlSXBkdygpKVxuICAgIHZpZXcudG9nZ2xlKClcblxuICBzaG93T3BlbkZpbGVzOiAtPlxuICAgIE9wZW5GaWxlc1ZpZXcgPz0gcmVxdWlyZSAnLi92aWV3L29wZW4tZmlsZXMtdmlldydcbiAgICBzaG93T3BlbkZpbGVzVmlldyA9IG5ldyBPcGVuRmlsZXNWaWV3KEBnZXRPckNyZWF0ZUlwZHcoKSlcbiAgICBzaG93T3BlbkZpbGVzVmlldy50b2dnbGUoKVxuXG4gIGluaXRpYWxpemVJcGR3SWZOZWNlc3Nhcnk6IC0+XG4gICAgaWYgYXRvbS5jb25maWcuZ2V0ICdyZW1vdGUtZWRpdC5ub3RpZmljYXRpb25zJ1xuICAgICAgc3RvcCA9IGZhbHNlXG4gICAgICBmb3IgZWRpdG9yIGluIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkgd2hlbiAhc3RvcFxuICAgICAgICBpZiBlZGl0b3IgaW5zdGFuY2VvZiBSZW1vdGVFZGl0RWRpdG9yXG4gICAgICAgICAgQGdldE9yQ3JlYXRlSXBkdygpXG4gICAgICAgICAgc3RvcCA9IHRydWVcblxuICBnZXRPckNyZWF0ZUlwZHc6IC0+XG4gICAgaWYgQGlwZHcgaXMgdW5kZWZpbmVkXG4gICAgICBJbnRlclByb2Nlc3NEYXRhV2F0Y2hlciA/PSByZXF1aXJlICcuL21vZGVsL2ludGVyLXByb2Nlc3MtZGF0YS13YXRjaGVyJ1xuICAgICAgZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuICAgICAgQGlwZHcgPSBuZXcgSW50ZXJQcm9jZXNzRGF0YVdhdGNoZXIoZnMuYWJzb2x1dGUoYXRvbS5jb25maWcuZ2V0KCdyZW1vdGUtZWRpdC5kZWZhdWx0U2VyaWFsaXplUGF0aCcpKSlcbiAgICBlbHNlXG4gICAgICBAaXBkd1xuXG4gIHNldHVwT3BlbmVyczogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIgKHVyaVRvT3BlbikgLT5cbiAgICAgIHVybCA/PSByZXF1aXJlICd1cmwnXG4gICAgICB0cnlcbiAgICAgICAge3Byb3RvY29sLCBob3N0LCBxdWVyeX0gPSB1cmwucGFyc2UodXJpVG9PcGVuLCB0cnVlKVxuICAgICAgY2F0Y2ggZXJyb3JcbiAgICAgICAgcmV0dXJuXG4gICAgICByZXR1cm4gdW5sZXNzIHByb3RvY29sIGlzICdyZW1vdGUtZWRpdDonXG5cbiAgICAgIGlmIGhvc3QgaXMgJ2xvY2FsZmlsZSdcbiAgICAgICAgUSA/PSByZXF1aXJlICdxJ1xuICAgICAgICBIb3N0ID89IHJlcXVpcmUgJy4vbW9kZWwvaG9zdCdcbiAgICAgICAgRnRwSG9zdCA/PSByZXF1aXJlICcuL21vZGVsL2Z0cC1ob3N0J1xuICAgICAgICBTZnRwSG9zdCA/PSByZXF1aXJlICcuL21vZGVsL3NmdHAtaG9zdCdcbiAgICAgICAgTG9jYWxGaWxlID89IHJlcXVpcmUgJy4vbW9kZWwvbG9jYWwtZmlsZSdcbiAgICAgICAgbG9jYWxGaWxlID0gTG9jYWxGaWxlLmRlc2VyaWFsaXplKEpTT04ucGFyc2UoZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5LmxvY2FsRmlsZSkpKVxuICAgICAgICBob3N0ID0gSG9zdC5kZXNlcmlhbGl6ZShKU09OLnBhcnNlKGRlY29kZVVSSUNvbXBvbmVudChxdWVyeS5ob3N0KSkpXG5cbiAgICAgICAgYXRvbS5wcm9qZWN0LmJ1ZmZlckZvclBhdGgobG9jYWxGaWxlLnBhdGgpLnRoZW4gKGJ1ZmZlcikgLT5cbiAgICAgICAgICBwYXJhbXMgPSB7YnVmZmVyOiBidWZmZXIsIHJlZ2lzdGVyRWRpdG9yOiB0cnVlLCBob3N0OiBob3N0LCBsb2NhbEZpbGU6IGxvY2FsRmlsZX1cbiAgICAgICAgICAjIGNvcGllZCBmcm9tIHdvcmtzcGFjZS5idWlsZFRleHRFZGl0b3JcbiAgICAgICAgICB3cyA9IGF0b20ud29ya3NwYWNlXG4gICAgICAgICAgcGFyYW1zID0gXy5leHRlbmQoe1xuICAgICAgICAgICAgY29uZmlnOiB3cy5jb25maWcsIG5vdGlmaWNhdGlvbk1hbmFnZXI6IHdzLm5vdGlmaWNhdGlvbk1hbmFnZXIsIHBhY2thZ2VNYW5hZ2VyOiB3cy5wYWNrYWdlTWFuYWdlciwgY2xpcGJvYXJkOiB3cy5jbGlwYm9hcmQsIHZpZXdSZWdpc3RyeTogd3Mudmlld1JlZ2lzdHJ5LFxuICAgICAgICAgICAgZ3JhbW1hclJlZ2lzdHJ5OiB3cy5ncmFtbWFyUmVnaXN0cnksIHByb2plY3Q6IHdzLnByb2plY3QsIGFzc2VydDogd3MuYXNzZXJ0LCBhcHBsaWNhdGlvbkRlbGVnYXRlOiB3cy5hcHBsaWNhdGlvbkRlbGVnYXRlXG4gICAgICAgICAgfSwgcGFyYW1zKVxuICAgICAgICAgIGVkaXRvciA9IG5ldyBSZW1vdGVFZGl0RWRpdG9yKHBhcmFtcylcbiJdfQ==
