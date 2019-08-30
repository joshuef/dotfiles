(function() {
  var LB, chai, defaultConfig, expect, fs, grammarTest, path, temp;

  chai = require('../node_modules/chai');

  expect = chai.expect;

  fs = require('fs-plus');

  path = require('path');

  defaultConfig = require('./default-config');

  grammarTest = require('atom-grammar-test');

  temp = require('temp');

  LB = 'language-babel';

  describe('language-babel', function() {
    var config, lb;
    lb = null;
    config = {};
    beforeEach(function() {
      temp.cleanup();
      waitsForPromise(function() {
        return atom.packages.activatePackage(LB);
      });
      config = JSON.parse(JSON.stringify(defaultConfig));
      return runs(function() {
        return lb = atom.packages.getActivePackage(LB).mainModule.transpiler;
      });
    });
    describe('Reading real config', function() {
      return it('should read all possible configuration keys', function() {
        var key, realConfig, results, value;
        realConfig = lb.getConfig();
        results = [];
        for (key in config) {
          value = config[key];
          results.push(expect(realConfig).to.contain.all.keys(key));
        }
        return results;
      });
    });
    describe(':getPaths', function() {
      if (!process.platform.match(/^win/)) {
        it('returns paths for a named sourcefile with default config', function() {
          var ret, tempProj1, tempProj2;
          tempProj1 = temp.mkdirSync();
          tempProj2 = temp.mkdirSync();
          atom.project.setPaths([tempProj1, tempProj2]);
          ret = lb.getPaths(tempProj1 + '/source/dira/fauxfile.js', config);
          expect(ret.sourceFile).to.equal(tempProj1 + '/source/dira/fauxfile.js');
          expect(ret.sourceFileDir).to.equal(tempProj1 + '/source/dira');
          expect(ret.mapFile).to.equal(tempProj1 + '/source/dira/fauxfile.js.map');
          expect(ret.transpiledFile).to.equal(tempProj1 + '/source/dira/fauxfile.js');
          expect(ret.sourceRoot).to.equal(tempProj1);
          return expect(ret.projectPath).to.equal(tempProj1);
        });
        it('returns paths config with target & source paths set', function() {
          var ret, tempProj1, tempProj2;
          tempProj1 = temp.mkdirSync();
          tempProj2 = temp.mkdirSync();
          atom.project.setPaths([tempProj1, tempProj2]);
          config.babelSourcePath = '/source';
          config.babelMapsPath = 'mapspath';
          config.babelTranspilePath = '/transpath';
          ret = lb.getPaths(tempProj1 + '/source/dira/fauxfile.js', config);
          expect(ret.sourceFile).to.equal(tempProj1 + '/source/dira/fauxfile.js');
          expect(ret.sourceFileDir).to.equal(tempProj1 + '/source/dira');
          expect(ret.mapFile).to.equal(tempProj1 + '/mapspath/dira/fauxfile.js.map');
          expect(ret.transpiledFile).to.equal(tempProj1 + '/transpath/dira/fauxfile.js');
          expect(ret.sourceRoot).to.equal(tempProj1 + '/source');
          return expect(ret.projectPath).to.equal(tempProj1);
        });
        it('returns correct paths with project in root directory', function() {
          var ret, tempProj1, tempProj2;
          tempProj1 = temp.mkdirSync();
          tempProj2 = temp.mkdirSync();
          atom.project.setPaths(['/']);
          config.babelSourcePath = 'source';
          config.babelMapsPath = 'mapspath';
          config.babelTranspilePath = 'transpath';
          ret = lb.getPaths('/source/dira/fauxfile.js', config);
          expect(ret.sourceFile).to.equal('/source/dira/fauxfile.js');
          expect(ret.sourceFileDir).to.equal('/source/dira');
          expect(ret.mapFile).to.equal('/mapspath/dira/fauxfile.js.map');
          expect(ret.transpiledFile).to.equal('/transpath/dira/fauxfile.js');
          expect(ret.sourceRoot).to.equal('/source');
          return expect(ret.projectPath).to.equal('/');
        });
      }
      if (process.platform.match(/^win/)) {
        it('returns paths for a named sourcefile with default config', function() {
          var ret, tempProj1, tempProj2;
          tempProj1 = temp.mkdirSync();
          tempProj2 = temp.mkdirSync();
          atom.project.setPaths([tempProj1, tempProj2]);
          ret = lb.getPaths(tempProj1 + '\\source\\dira\\fauxfile.js', config);
          expect(ret.sourceFile).to.equal(tempProj1 + '\\source\\dira\\fauxfile.js');
          expect(ret.sourceFileDir).to.equal(tempProj1 + '\\source\\dira');
          expect(ret.mapFile).to.equal(tempProj1 + '\\source\\dira\\fauxfile.js.map');
          expect(ret.transpiledFile).to.equal(tempProj1 + '\\source\\dira\\fauxfile.js');
          expect(ret.sourceRoot).to.equal(tempProj1);
          return expect(ret.projectPath).to.equal(tempProj1);
        });
        it('returns paths config with target & source paths set', function() {
          var ret, tempProj1, tempProj2;
          tempProj1 = temp.mkdirSync();
          tempProj2 = temp.mkdirSync();
          atom.project.setPaths([tempProj1, tempProj2]);
          config.babelSourcePath = '\\source';
          config.babelMapsPath = 'mapspath';
          config.babelTranspilePath = '\\transpath';
          ret = lb.getPaths(tempProj1 + '\\source\\dira\\fauxfile.js', config);
          expect(ret.sourceFile).to.equal(tempProj1 + '\\source\\dira\\fauxfile.js');
          expect(ret.sourceFileDir).to.equal(tempProj1 + '\\source\\dira');
          expect(ret.mapFile).to.equal(tempProj1 + '\\mapspath\\dira\\fauxfile.js.map');
          expect(ret.transpiledFile).to.equal(tempProj1 + '\\transpath\\dira\\fauxfile.js');
          expect(ret.sourceRoot).to.equal(tempProj1 + '\\source');
          return expect(ret.projectPath).to.equal(tempProj1);
        });
        return it('returns correct paths with project in root directory', function() {
          var ret;
          atom.project.setPaths(['C:\\']);
          config.babelSourcePath = 'source';
          config.babelMapsPath = 'mapspath';
          config.babelTranspilePath = 'transpath';
          ret = lb.getPaths('C:\\source\\dira\\fauxfile.js', config);
          expect(ret.sourceFile).to.equal('C:\\source\\dira\\fauxfile.js');
          expect(ret.sourceFileDir).to.equal('C:\\source\\dira');
          expect(ret.mapFile).to.equal('C:\\mapspath\\dira\\fauxfile.js.map');
          expect(ret.transpiledFile).to.equal('C:\\transpath\\dira\\fauxfile.js');
          expect(ret.sourceRoot).to.equal('C:\\source');
          return expect(ret.projectPath).to.equal('C:\\');
        });
      }
    });
    return describe(':transpile', function() {
      var notification, notificationSpy, writeFileName, writeFileStub;
      notificationSpy = null;
      notification = null;
      writeFileStub = null;
      writeFileName = null;
      beforeEach(function() {
        notificationSpy = jasmine.createSpy('notificationSpy');
        notification = atom.notifications.onDidAddNotification(notificationSpy);
        writeFileName = null;
        return writeFileStub = spyOn(fs, 'writeFileSync').andCallFake(function(path) {
          return writeFileName = path;
        });
      });
      afterEach(function() {
        return notification.dispose();
      });
      describe('when transpileOnSave is false', function() {
        return it('does nothing', function() {
          config.transpileOnSave = false;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile('somefilename');
          expect(notificationSpy.callCount).to.equal(0);
          return expect(writeFileStub.callCount).to.equal(0);
        });
      });
      describe('When a source file is outside the "babelSourcePath" & suppress msgs false', function() {
        return it('notifies sourcefile is not inside sourcepath', function() {
          var msg, type;
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures';
          config.babelMapsPath = 'fixtures';
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(__dirname + '/fake.js');
          expect(notificationSpy.callCount).to.equal(1);
          msg = notificationSpy.calls[0].args[0].message;
          type = notificationSpy.calls[0].args[0].type;
          expect(msg).to.match(/^LB: Babel file is not inside/);
          return expect(writeFileStub.callCount).to.equal(0);
        });
      });
      describe('When a source file is outside the "babelSourcePath" & suppress msgs true', function() {
        return it('exects no notifications', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures';
          config.babelMapsPath = 'fixtures';
          config.suppressSourcePathMessages = true;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(__dirname + '/fake.js');
          expect(notificationSpy.callCount).to.equal(0);
          return expect(writeFileStub.callCount).to.equal(0);
        });
      });
      describe('When a js files is transpiled and gets an error', function() {
        return it('it issues a notification error message', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures';
          config.babelMapsPath = 'fixtures';
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(path.resolve(__dirname, 'fixtures/dira/dira.1/dira.2/bad.js'));
          waitsFor(function() {
            return notificationSpy.callCount;
          });
          return runs(function() {
            var msg;
            expect(notificationSpy.callCount).to.equal(1);
            msg = notificationSpy.calls[0].args[0].message;
            expect(msg).to.match(/^LB: Babel.*Transpiler Error/);
            return expect(writeFileStub.callCount).to.equal(0);
          });
        });
      });
      describe('When a js file saved but no output is set', function() {
        return it('calls the transpiler but doesnt save output', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures';
          config.babelMapsPath = 'fixtures';
          config.createTranspiledCode = false;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(path.resolve(__dirname, 'fixtures/dira/dira.1/dira.2/react.jsx'));
          waitsFor(function() {
            return notificationSpy.callCount > 1;
          });
          return runs(function() {
            var msg;
            expect(notificationSpy.callCount).to.equal(2);
            msg = notificationSpy.calls[0].args[0].message;
            expect(msg).to.match(/^LB: Babel.*Transpiler Success/);
            msg = notificationSpy.calls[1].args[0].message;
            expect(msg).to.match(/^LB: No transpiled output configured/);
            return expect(writeFileStub.callCount).to.equal(0);
          });
        });
      });
      describe('When a js file saved but no transpile path is set', function() {
        return it('calls the transpiler and transpiles OK but doesnt save and issues msg', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures';
          config.babelMapsPath = 'fixtures';
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(path.resolve(__dirname, 'fixtures/dira/dira.1/dira.2/good.js'));
          waitsFor(function() {
            return notificationSpy.callCount > 1;
          });
          return runs(function() {
            var msg;
            expect(notificationSpy.callCount).to.equal(2);
            msg = notificationSpy.calls[0].args[0].message;
            expect(msg).to.match(/^LB: Babel.*Transpiler Success/);
            msg = notificationSpy.calls[1].args[0].message;
            expect(msg).to.match(/^LB: Transpiled file would overwrite source file/);
            return expect(writeFileStub.callCount).to.equal(0);
          });
        });
      });
      describe('When a jsx file saved,transpile path is set, source maps enabled', function() {
        return it('calls the transpiler and transpiles OK, saves as .js and issues msg', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures-transpiled';
          config.babelMapsPath = 'fixtures-maps';
          config.createMap = true;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(path.resolve(__dirname, 'fixtures/dira/dira.1/dira.2/react.jsx'));
          waitsFor(function() {
            return writeFileStub.callCount;
          });
          return runs(function() {
            var expectedFileName, msg, savedFilename;
            expect(notificationSpy.callCount).to.equal(1);
            msg = notificationSpy.calls[0].args[0].message;
            expect(msg).to.match(/^LB: Babel.*Transpiler Success/);
            expect(writeFileStub.callCount).to.equal(2);
            savedFilename = writeFileStub.calls[0].args[0];
            expectedFileName = path.resolve(__dirname, 'fixtures-transpiled/dira/dira.1/dira.2/react.js');
            expect(savedFilename).to.equal(expectedFileName);
            savedFilename = writeFileStub.calls[1].args[0];
            expectedFileName = path.resolve(__dirname, 'fixtures-maps/dira/dira.1/dira.2/react.js.map');
            return expect(savedFilename).to.equal(expectedFileName);
          });
        });
      });
      describe('When a jsx file saved,transpile path is set, source maps enabled, success suppressed', function() {
        return it('calls the transpiler and transpiles OK, saves as .js and issues msg', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures-transpiled';
          config.babelMapsPath = 'fixtures-maps';
          config.createMap = true;
          config.suppressTranspileOnSaveMessages = true;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(path.resolve(__dirname, 'fixtures/dira/dira.1/dira.2/react.jsx'));
          waitsFor(function() {
            return writeFileStub.callCount;
          });
          return runs(function() {
            var expectedFileName, savedFilename;
            expect(notificationSpy.callCount).to.equal(0);
            expect(writeFileStub.callCount).to.equal(2);
            savedFilename = writeFileStub.calls[0].args[0];
            expectedFileName = path.resolve(__dirname, 'fixtures-transpiled/dira/dira.1/dira.2/react.js');
            expect(savedFilename).to.equal(expectedFileName);
            savedFilename = writeFileStub.calls[1].args[0];
            expectedFileName = path.resolve(__dirname, 'fixtures-maps/dira/dira.1/dira.2/react.js.map');
            return expect(savedFilename).to.equal(expectedFileName);
          });
        });
      });
      describe('When a js file saved , babelrc in path and flag disableWhenNoBabelrcFileInPath is set', function() {
        return it('calls the transpiler', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures';
          config.babelMapsPath = 'fixtures';
          config.createTranspiledCode = false;
          config.disableWhenNoBabelrcFileInPath = true;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(path.resolve(__dirname, 'fixtures/dira/dira.1/dira.2/good.js'));
          waitsFor(function() {
            return notificationSpy.callCount;
          });
          return runs(function() {
            var msg;
            expect(notificationSpy.callCount).to.equal(2);
            msg = notificationSpy.calls[0].args[0].message;
            expect(msg).to.match(/^LB: Babel.*Transpiler Success/);
            msg = notificationSpy.calls[1].args[0].message;
            expect(msg).to.match(/^LB: No transpiled output configured/);
            return expect(writeFileStub.callCount).to.equal(0);
          });
        });
      });
      describe('When a js file saved , babelrc in not in path and flag disableWhenNoBabelrcFileInPath is set', function() {
        return it('does nothing', function() {
          atom.project.setPaths([__dirname]);
          config.babelSourcePath = 'fixtures';
          config.babelTranspilePath = 'fixtures';
          config.babelMapsPath = 'fixtures';
          config.createTranspiledCode = false;
          config.disableWhenNoBabelrcFileInPath = true;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          lb.transpile(path.resolve(__dirname, 'fixtures/dirb/good.js'));
          expect(notificationSpy.callCount).to.equal(0);
          return expect(writeFileStub.callCount).to.equal(0);
        });
      });
      describe('When a js file saved in a nested project', function() {
        return it('creates a file in the correct location based upon .languagebabel', function() {
          var sourceFile, targetFile;
          atom.project.setPaths([__dirname]);
          config.allowLocalOverride = true;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          sourceFile = path.resolve(__dirname, 'fixtures/projectRoot/src/test.js');
          targetFile = path.resolve(__dirname, 'fixtures/projectRoot/test.js');
          lb.transpile(sourceFile);
          waitsFor(function() {
            return writeFileStub.callCount;
          });
          return runs(function() {
            return expect(writeFileName).to.equal(targetFile);
          });
        });
      });
      return describe('When a directory is compiled', function() {
        return it('transpiles the js,jsx,es,es6,babel files but ignores minified files', function() {
          var sourceDir;
          atom.project.setPaths([__dirname]);
          config.allowLocalOverride = true;
          spyOn(lb, 'getConfig').andCallFake(function() {
            return config;
          });
          sourceDir = path.resolve(__dirname, 'fixtures/projectRoot/src/');
          lb.transpileDirectory({
            directory: sourceDir
          });
          waitsFor(function() {
            return writeFileStub.callCount >= 5;
          });
          return runs(function() {
            return expect(writeFileStub.callCount).to.equal(5);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtYmFiZWwvc3BlYy90cmFuc3BpbGUtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLElBQUEsR0FBTyxPQUFBLENBQVEsc0JBQVI7O0VBQ1AsTUFBQSxHQUFTLElBQUksQ0FBQzs7RUFDZCxFQUFBLEdBQUssT0FBQSxDQUFRLFNBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUNoQixXQUFBLEdBQWMsT0FBQSxDQUFRLG1CQUFSOztFQUNkLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUCxFQUFBLEdBQUs7O0VBUUwsUUFBQSxDQUFTLGdCQUFULEVBQTJCLFNBQUE7QUFDekIsUUFBQTtJQUFBLEVBQUEsR0FBSztJQUNMLE1BQUEsR0FBVTtJQUNWLFVBQUEsQ0FBVyxTQUFBO01BQ1QsSUFBSSxDQUFDLE9BQUwsQ0FBQTtNQUNBLGVBQUEsQ0FBZ0IsU0FBQTtlQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixFQUE5QjtNQURjLENBQWhCO01BRUEsTUFBQSxHQUFTLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLFNBQUwsQ0FBZSxhQUFmLENBQVg7YUFFVCxJQUFBLENBQUssU0FBQTtlQUNILEVBQUEsR0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFkLENBQStCLEVBQS9CLENBQWtDLENBQUMsVUFBVSxDQUFDO01BRGhELENBQUw7SUFOUyxDQUFYO0lBU0EsUUFBQSxDQUFTLHFCQUFULEVBQWdDLFNBQUE7YUFDOUIsRUFBQSxDQUFHLDZDQUFILEVBQWtELFNBQUE7QUFDaEQsWUFBQTtRQUFBLFVBQUEsR0FBYSxFQUFFLENBQUMsU0FBSCxDQUFBO0FBQ2I7YUFBQSxhQUFBOzt1QkFBQSxN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QUU1QixLQUFBLENBQU0sRUFBTixFQUFVLFdBQVYsQ0FBc0IsQ0FBQyxXQUF2QixDQUFtQyxTQUFBO21CQUFHO1VBQUgsQ0FBbkM7VUFDQSxTQUFBLEdBQVksSUFBSSxDQUFDLE9BQUwsQ0FBYSxTQUFiLEVBQXdCLDJCQUF4QjtVQUNaLEVBQUUsQ0FBQyxrQkFBSCxDQUFzQjtZQUFDLFNBQUEsRUFBVyxTQUFaO1dBQXRCO1VBQ0EsUUFBQSxDQUFTLFNBQUE7bUJBQ1AsYUFBYSxDQUFDLFNBQWQsSUFBMkI7VUFEcEIsQ0FBVDtpQkFFQSxJQUFBLENBQUssU0FBQTttQkFDSCxNQUFBLENBQU8sYUFBYSxDQUFDLFNBQXJCLENBQStCLENBQUMsRUFBRSxDQUFDLEtBQW5DLENBQXlDLENBQXpDO1VBREcsQ0FBTDtRQVR3RSxDQUExRTtNQUR1QyxDQUF6QztJQW5OcUIsQ0FBdkI7RUFuSHlCLENBQTNCO0FBaEJBIiwic291cmNlc0NvbnRlbnQiOlsiY2hhaSA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9jaGFpJ1xuZXhwZWN0ID0gY2hhaS5leHBlY3RcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbnBhdGggPSByZXF1aXJlICdwYXRoJ1xuZGVmYXVsdENvbmZpZyA9IHJlcXVpcmUgJy4vZGVmYXVsdC1jb25maWcnXG5ncmFtbWFyVGVzdCA9IHJlcXVpcmUgJ2F0b20tZ3JhbW1hci10ZXN0J1xudGVtcCA9IHJlcXVpcmUoJ3RlbXAnKTtcblxuTEIgPSAnbGFuZ3VhZ2UtYmFiZWwnXG4jIHdlIHVzZSBhdG9tIHNldFBhdGhzIGluIHRoaXMgc3BlYy4gc2V0UGF0aHMgY2hlY2tzIGlmIGRpcmVjdG9yaWVzIGV4aXN0XG4jIHRodXM6LSBzZXRQYXRocyhbJy9yb290L1Byb2plY3QxJ10pIG1heSBmaW5kIC9yb290IGJ1dCBub3QgL3Jvb3QvUHJvamVjdDFcbiMgYW5kIHNldHMgdGhlIHByb2ogZGlyIGFzIC9yb290IHJhdGhlciB0aGFuIC9yb290L1Byb2plY3QxLiBJZiAvcm9vdC9Qcm9qZWN0MVxuIyB3ZXJlIG5vIGZvdW5kLCBhdG9tIHNldHMgdGhlIGRpcmVjdG9yeSB0byB0aGUgZnVsbCBuYW1lLlxuIyBXZSBuZWVkIHNvbWUgcHJlZml4IGRpcmVjdG9yeSBmYXV4IG5hbWVzIGZvciBwb3NpeCBhbmQgd2luZG93cyB0byBlbnN1cmVcbiMgd2UgYWx3YXlzIGdldCBhIHByb2plY3QgbmFtZSB3ZSBzZXRcblxuZGVzY3JpYmUgJ2xhbmd1YWdlLWJhYmVsJywgLT5cbiAgbGIgPSBudWxsXG4gIGNvbmZpZyA9ICB7fVxuICBiZWZvcmVFYWNoIC0+XG4gICAgdGVtcC5jbGVhbnVwKClcbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKExCKVxuICAgIGNvbmZpZyA9IEpTT04ucGFyc2UgSlNPTi5zdHJpbmdpZnkgZGVmYXVsdENvbmZpZ1xuXG4gICAgcnVucyAtPlxuICAgICAgbGIgPSBhdG9tLnBhY2thZ2VzLmdldEFjdGl2ZVBhY2thZ2UoTEIpLm1haW5Nb2R1bGUudHJhbnNwaWxlclxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVzY3JpYmUgJ1JlYWRpbmcgcmVhbCBjb25maWcnLCAtPlxuICAgIGl0ICdzaG91bGQgcmVhZCBhbGwgcG9zc2libGUgY29uZmlndXJhdGlvbiBrZXlzJywgLT5cbiAgICAgIHJlYWxDb25maWcgPSBsYi5nZXRDb25maWcoKVxuICAgICAgZXhwZWN0KHJlYWxDb25maWcpLnRvLmNvbnRhaW4uYWxsLmtleXMga2V5IGZvciBrZXksIHZhbHVlIG9mIGNvbmZpZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVzY3JpYmUgJzpnZXRQYXRocycsIC0+XG5cbiAgICBpZiBub3QgcHJvY2Vzcy5wbGF0Zm9ybS5tYXRjaCAvXndpbi9cbiAgICAgIGl0ICdyZXR1cm5zIHBhdGhzIGZvciBhIG5hbWVkIHNvdXJjZWZpbGUgd2l0aCBkZWZhdWx0IGNvbmZpZycsIC0+XG4gICAgICAgIHRlbXBQcm9qMSA9IHRlbXAubWtkaXJTeW5jKClcbiAgICAgICAgdGVtcFByb2oyID0gdGVtcC5ta2RpclN5bmMoKVxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW3RlbXBQcm9qMSx0ZW1wUHJvajJdKVxuXG4gICAgICAgIHJldCA9IGxiLmdldFBhdGhzKHRlbXBQcm9qMSsnL3NvdXJjZS9kaXJhL2ZhdXhmaWxlLmpzJyxjb25maWcpXG5cbiAgICAgICAgZXhwZWN0KHJldC5zb3VyY2VGaWxlKS50by5lcXVhbCh0ZW1wUHJvajErJy9zb3VyY2UvZGlyYS9mYXV4ZmlsZS5qcycpXG4gICAgICAgIGV4cGVjdChyZXQuc291cmNlRmlsZURpcikudG8uZXF1YWwodGVtcFByb2oxKycvc291cmNlL2RpcmEnKVxuICAgICAgICBleHBlY3QocmV0Lm1hcEZpbGUpLnRvLmVxdWFsKHRlbXBQcm9qMSsnL3NvdXJjZS9kaXJhL2ZhdXhmaWxlLmpzLm1hcCcpXG4gICAgICAgIGV4cGVjdChyZXQudHJhbnNwaWxlZEZpbGUpLnRvLmVxdWFsKHRlbXBQcm9qMSsnL3NvdXJjZS9kaXJhL2ZhdXhmaWxlLmpzJylcbiAgICAgICAgZXhwZWN0KHJldC5zb3VyY2VSb290KS50by5lcXVhbCh0ZW1wUHJvajEpXG4gICAgICAgIGV4cGVjdChyZXQucHJvamVjdFBhdGgpLnRvLmVxdWFsKHRlbXBQcm9qMSlcblxuICAgICAgaXQgJ3JldHVybnMgcGF0aHMgY29uZmlnIHdpdGggdGFyZ2V0ICYgc291cmNlIHBhdGhzIHNldCcsIC0+XG4gICAgICAgIHRlbXBQcm9qMSA9IHRlbXAubWtkaXJTeW5jKClcbiAgICAgICAgdGVtcFByb2oyID0gdGVtcC5ta2RpclN5bmMoKVxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW3RlbXBQcm9qMSx0ZW1wUHJvajJdKVxuICAgICAgICBjb25maWcuYmFiZWxTb3VyY2VQYXRoID0gJy9zb3VyY2UnICMgd2l0aCBkaXIgcHJlZml4XG4gICAgICAgIGNvbmZpZy5iYWJlbE1hcHNQYXRoID0nbWFwc3BhdGgnICMgYW5kIHdpdGhvdXRcbiAgICAgICAgY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aCA9ICcvdHJhbnNwYXRoJ1xuXG4gICAgICAgIHJldCA9IGxiLmdldFBhdGhzKHRlbXBQcm9qMSsnL3NvdXJjZS9kaXJhL2ZhdXhmaWxlLmpzJyxjb25maWcpXG5cbiAgICAgICAgZXhwZWN0KHJldC5zb3VyY2VGaWxlKS50by5lcXVhbCh0ZW1wUHJvajErJy9zb3VyY2UvZGlyYS9mYXV4ZmlsZS5qcycpXG4gICAgICAgIGV4cGVjdChyZXQuc291cmNlRmlsZURpcikudG8uZXF1YWwodGVtcFByb2oxKycvc291cmNlL2RpcmEnKVxuICAgICAgICBleHBlY3QocmV0Lm1hcEZpbGUpLnRvLmVxdWFsKHRlbXBQcm9qMSsnL21hcHNwYXRoL2RpcmEvZmF1eGZpbGUuanMubWFwJylcbiAgICAgICAgZXhwZWN0KHJldC50cmFuc3BpbGVkRmlsZSkudG8uZXF1YWwodGVtcFByb2oxKycvdHJhbnNwYXRoL2RpcmEvZmF1eGZpbGUuanMnKVxuICAgICAgICBleHBlY3QocmV0LnNvdXJjZVJvb3QpLnRvLmVxdWFsKHRlbXBQcm9qMSsnL3NvdXJjZScpXG4gICAgICAgIGV4cGVjdChyZXQucHJvamVjdFBhdGgpLnRvLmVxdWFsKHRlbXBQcm9qMSlcblxuICAgICAgaXQgJ3JldHVybnMgY29ycmVjdCBwYXRocyB3aXRoIHByb2plY3QgaW4gcm9vdCBkaXJlY3RvcnknLCAtPlxuICAgICAgICB0ZW1wUHJvajEgPSB0ZW1wLm1rZGlyU3luYygpXG4gICAgICAgIHRlbXBQcm9qMiA9IHRlbXAubWtkaXJTeW5jKClcbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFsnLyddKVxuICAgICAgICBjb25maWcuYmFiZWxTb3VyY2VQYXRoID0gJ3NvdXJjZSdcbiAgICAgICAgY29uZmlnLmJhYmVsTWFwc1BhdGggPSdtYXBzcGF0aCdcbiAgICAgICAgY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aCA9ICd0cmFuc3BhdGgnXG5cbiAgICAgICAgcmV0ID0gbGIuZ2V0UGF0aHMoJy9zb3VyY2UvZGlyYS9mYXV4ZmlsZS5qcycsY29uZmlnKVxuXG4gICAgICAgIGV4cGVjdChyZXQuc291cmNlRmlsZSkudG8uZXF1YWwoJy9zb3VyY2UvZGlyYS9mYXV4ZmlsZS5qcycpXG4gICAgICAgIGV4cGVjdChyZXQuc291cmNlRmlsZURpcikudG8uZXF1YWwoJy9zb3VyY2UvZGlyYScpXG4gICAgICAgIGV4cGVjdChyZXQubWFwRmlsZSkudG8uZXF1YWwoJy9tYXBzcGF0aC9kaXJhL2ZhdXhmaWxlLmpzLm1hcCcpXG4gICAgICAgIGV4cGVjdChyZXQudHJhbnNwaWxlZEZpbGUpLnRvLmVxdWFsKCcvdHJhbnNwYXRoL2RpcmEvZmF1eGZpbGUuanMnKVxuICAgICAgICBleHBlY3QocmV0LnNvdXJjZVJvb3QpLnRvLmVxdWFsKCcvc291cmNlJylcbiAgICAgICAgZXhwZWN0KHJldC5wcm9qZWN0UGF0aCkudG8uZXF1YWwoJy8nKVxuXG4gICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybS5tYXRjaCAvXndpbi9cbiAgICAgIGl0ICdyZXR1cm5zIHBhdGhzIGZvciBhIG5hbWVkIHNvdXJjZWZpbGUgd2l0aCBkZWZhdWx0IGNvbmZpZycsIC0+XG4gICAgICAgIHRlbXBQcm9qMSA9IHRlbXAubWtkaXJTeW5jKClcbiAgICAgICAgdGVtcFByb2oyID0gdGVtcC5ta2RpclN5bmMoKVxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW3RlbXBQcm9qMSx0ZW1wUHJvajJdKVxuXG4gICAgICAgIHJldCA9IGxiLmdldFBhdGhzKHRlbXBQcm9qMSsnXFxcXHNvdXJjZVxcXFxkaXJhXFxcXGZhdXhmaWxlLmpzJyxjb25maWcpXG5cbiAgICAgICAgZXhwZWN0KHJldC5zb3VyY2VGaWxlKS50by5lcXVhbCh0ZW1wUHJvajErJ1xcXFxzb3VyY2VcXFxcZGlyYVxcXFxmYXV4ZmlsZS5qcycpXG4gICAgICAgIGV4cGVjdChyZXQuc291cmNlRmlsZURpcikudG8uZXF1YWwodGVtcFByb2oxKydcXFxcc291cmNlXFxcXGRpcmEnKVxuICAgICAgICBleHBlY3QocmV0Lm1hcEZpbGUpLnRvLmVxdWFsKHRlbXBQcm9qMSsnXFxcXHNvdXJjZVxcXFxkaXJhXFxcXGZhdXhmaWxlLmpzLm1hcCcpXG4gICAgICAgIGV4cGVjdChyZXQudHJhbnNwaWxlZEZpbGUpLnRvLmVxdWFsKHRlbXBQcm9qMSsnXFxcXHNvdXJjZVxcXFxkaXJhXFxcXGZhdXhmaWxlLmpzJylcbiAgICAgICAgZXhwZWN0KHJldC5zb3VyY2VSb290KS50by5lcXVhbCh0ZW1wUHJvajEpXG4gICAgICAgIGV4cGVjdChyZXQucHJvamVjdFBhdGgpLnRvLmVxdWFsKHRlbXBQcm9qMSlcblxuICAgICAgaXQgJ3JldHVybnMgcGF0aHMgY29uZmlnIHdpdGggdGFyZ2V0ICYgc291cmNlIHBhdGhzIHNldCcsIC0+XG4gICAgICAgIHRlbXBQcm9qMSA9IHRlbXAubWtkaXJTeW5jKClcbiAgICAgICAgdGVtcFByb2oyID0gdGVtcC5ta2RpclN5bmMoKVxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW3RlbXBQcm9qMSwgdGVtcFByb2oyXSlcbiAgICAgICAgY29uZmlnLmJhYmVsU291cmNlUGF0aCA9ICdcXFxcc291cmNlJyAjIHdpdGggZGlyIHByZWZpeFxuICAgICAgICBjb25maWcuYmFiZWxNYXBzUGF0aCA9J21hcHNwYXRoJyAjIGFuZCB3aXRob3V0XG4gICAgICAgIGNvbmZpZy5iYWJlbFRyYW5zcGlsZVBhdGggPSAnXFxcXHRyYW5zcGF0aCdcblxuICAgICAgICByZXQgPSBsYi5nZXRQYXRocyh0ZW1wUHJvajErJ1xcXFxzb3VyY2VcXFxcZGlyYVxcXFxmYXV4ZmlsZS5qcycsY29uZmlnKVxuXG4gICAgICAgIGV4cGVjdChyZXQuc291cmNlRmlsZSkudG8uZXF1YWwodGVtcFByb2oxKydcXFxcc291cmNlXFxcXGRpcmFcXFxcZmF1eGZpbGUuanMnKVxuICAgICAgICBleHBlY3QocmV0LnNvdXJjZUZpbGVEaXIpLnRvLmVxdWFsKHRlbXBQcm9qMSsnXFxcXHNvdXJjZVxcXFxkaXJhJylcbiAgICAgICAgZXhwZWN0KHJldC5tYXBGaWxlKS50by5lcXVhbCh0ZW1wUHJvajErJ1xcXFxtYXBzcGF0aFxcXFxkaXJhXFxcXGZhdXhmaWxlLmpzLm1hcCcpXG4gICAgICAgIGV4cGVjdChyZXQudHJhbnNwaWxlZEZpbGUpLnRvLmVxdWFsKHRlbXBQcm9qMSsnXFxcXHRyYW5zcGF0aFxcXFxkaXJhXFxcXGZhdXhmaWxlLmpzJylcbiAgICAgICAgZXhwZWN0KHJldC5zb3VyY2VSb290KS50by5lcXVhbCh0ZW1wUHJvajErJ1xcXFxzb3VyY2UnKVxuICAgICAgICBleHBlY3QocmV0LnByb2plY3RQYXRoKS50by5lcXVhbCh0ZW1wUHJvajEpXG5cbiAgICAgIGl0ICdyZXR1cm5zIGNvcnJlY3QgcGF0aHMgd2l0aCBwcm9qZWN0IGluIHJvb3QgZGlyZWN0b3J5JywgLT5cbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFsnQzpcXFxcJ10pXG4gICAgICAgIGNvbmZpZy5iYWJlbFNvdXJjZVBhdGggPSAnc291cmNlJ1xuICAgICAgICBjb25maWcuYmFiZWxNYXBzUGF0aCA9J21hcHNwYXRoJ1xuICAgICAgICBjb25maWcuYmFiZWxUcmFuc3BpbGVQYXRoID0gJ3RyYW5zcGF0aCdcblxuICAgICAgICByZXQgPSBsYi5nZXRQYXRocygnQzpcXFxcc291cmNlXFxcXGRpcmFcXFxcZmF1eGZpbGUuanMnLGNvbmZpZylcblxuICAgICAgICBleHBlY3QocmV0LnNvdXJjZUZpbGUpLnRvLmVxdWFsKCdDOlxcXFxzb3VyY2VcXFxcZGlyYVxcXFxmYXV4ZmlsZS5qcycpXG4gICAgICAgIGV4cGVjdChyZXQuc291cmNlRmlsZURpcikudG8uZXF1YWwoJ0M6XFxcXHNvdXJjZVxcXFxkaXJhJylcbiAgICAgICAgZXhwZWN0KHJldC5tYXBGaWxlKS50by5lcXVhbCgnQzpcXFxcbWFwc3BhdGhcXFxcZGlyYVxcXFxmYXV4ZmlsZS5qcy5tYXAnKVxuICAgICAgICBleHBlY3QocmV0LnRyYW5zcGlsZWRGaWxlKS50by5lcXVhbCgnQzpcXFxcdHJhbnNwYXRoXFxcXGRpcmFcXFxcZmF1eGZpbGUuanMnKVxuICAgICAgICBleHBlY3QocmV0LnNvdXJjZVJvb3QpLnRvLmVxdWFsKCdDOlxcXFxzb3VyY2UnKVxuICAgICAgICBleHBlY3QocmV0LnByb2plY3RQYXRoKS50by5lcXVhbCgnQzpcXFxcJylcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlc2NyaWJlICc6dHJhbnNwaWxlJywgLT5cbiAgICBub3RpZmljYXRpb25TcHkgPSBudWxsXG4gICAgbm90aWZpY2F0aW9uID0gbnVsbFxuICAgIHdyaXRlRmlsZVN0dWIgPSBudWxsXG4gICAgd3JpdGVGaWxlTmFtZSA9IG51bGxcblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIG5vdGlmaWNhdGlvblNweSA9IGphc21pbmUuY3JlYXRlU3B5ICdub3RpZmljYXRpb25TcHknXG4gICAgICBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMub25EaWRBZGROb3RpZmljYXRpb24gbm90aWZpY2F0aW9uU3B5XG4gICAgICB3cml0ZUZpbGVOYW1lID0gbnVsbFxuICAgICAgd3JpdGVGaWxlU3R1YiA9IHNweU9uKGZzLCd3cml0ZUZpbGVTeW5jJykuYW5kQ2FsbEZha2UgKHBhdGgpLT5cbiAgICAgICAgd3JpdGVGaWxlTmFtZSA9IHBhdGhcbiAgICBhZnRlckVhY2ggLT5cbiAgICAgIG5vdGlmaWNhdGlvbi5kaXNwb3NlKClcblxuICAgIGRlc2NyaWJlICd3aGVuIHRyYW5zcGlsZU9uU2F2ZSBpcyBmYWxzZScsIC0+XG4gICAgICBpdCAnZG9lcyBub3RoaW5nJywgLT5cbiAgICAgICAgY29uZmlnLnRyYW5zcGlsZU9uU2F2ZSA9IGZhbHNlXG5cbiAgICAgICAgc3B5T24obGIsICdnZXRDb25maWcnKS5hbmRDYWxsRmFrZSAtPiBjb25maWdcbiAgICAgICAgbGIudHJhbnNwaWxlKCdzb21lZmlsZW5hbWUnKVxuICAgICAgICBleHBlY3Qobm90aWZpY2F0aW9uU3B5LmNhbGxDb3VudCkudG8uZXF1YWwoMClcbiAgICAgICAgZXhwZWN0KHdyaXRlRmlsZVN0dWIuY2FsbENvdW50KS50by5lcXVhbCgwKVxuXG4gICAgZGVzY3JpYmUgJ1doZW4gYSBzb3VyY2UgZmlsZSBpcyBvdXRzaWRlIHRoZSBcImJhYmVsU291cmNlUGF0aFwiICYgc3VwcHJlc3MgbXNncyBmYWxzZScsIC0+XG4gICAgICBpdCAnbm90aWZpZXMgc291cmNlZmlsZSBpcyBub3QgaW5zaWRlIHNvdXJjZXBhdGgnLCAtPlxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW19fZGlybmFtZV0pXG4gICAgICAgIGNvbmZpZy5iYWJlbFNvdXJjZVBhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5iYWJlbFRyYW5zcGlsZVBhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5iYWJlbE1hcHNQYXRoID0gJ2ZpeHR1cmVzJ1xuXG4gICAgICAgIHNweU9uKGxiLCAnZ2V0Q29uZmlnJykuYW5kQ2FsbEZha2UgLT4gY29uZmlnXG4gICAgICAgIGxiLnRyYW5zcGlsZShfX2Rpcm5hbWUrJy9mYWtlLmpzJylcbiAgICAgICAgZXhwZWN0KG5vdGlmaWNhdGlvblNweS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICAgIG1zZyA9IG5vdGlmaWNhdGlvblNweS5jYWxsc1swXS5hcmdzWzBdLm1lc3NhZ2UgIyBmaXJzdCBjYWxsLCBmaXJzdCBhcmdcbiAgICAgICAgdHlwZSA9IG5vdGlmaWNhdGlvblNweS5jYWxsc1swXS5hcmdzWzBdLnR5cGVcbiAgICAgICAgZXhwZWN0KG1zZykudG8ubWF0Y2goL15MQjogQmFiZWwgZmlsZSBpcyBub3QgaW5zaWRlLylcbiAgICAgICAgZXhwZWN0KHdyaXRlRmlsZVN0dWIuY2FsbENvdW50KS50by5lcXVhbCgwKVxuXG4gICAgZGVzY3JpYmUgJ1doZW4gYSBzb3VyY2UgZmlsZSBpcyBvdXRzaWRlIHRoZSBcImJhYmVsU291cmNlUGF0aFwiICYgc3VwcHJlc3MgbXNncyB0cnVlJywgLT5cbiAgICAgIGl0ICdleGVjdHMgbm8gbm90aWZpY2F0aW9ucycsIC0+XG4gICAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhbX19kaXJuYW1lXSlcbiAgICAgICAgY29uZmlnLmJhYmVsU291cmNlUGF0aCA9ICdmaXh0dXJlcydcbiAgICAgICAgY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aCA9ICdmaXh0dXJlcydcbiAgICAgICAgY29uZmlnLmJhYmVsTWFwc1BhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5zdXBwcmVzc1NvdXJjZVBhdGhNZXNzYWdlcyA9IHRydWVcblxuICAgICAgICBzcHlPbihsYiwgJ2dldENvbmZpZycpLmFuZENhbGxGYWtlIC0+IGNvbmZpZ1xuICAgICAgICBsYi50cmFuc3BpbGUoX19kaXJuYW1lKycvZmFrZS5qcycpXG4gICAgICAgIGV4cGVjdChub3RpZmljYXRpb25TcHkuY2FsbENvdW50KS50by5lcXVhbCgwKVxuICAgICAgICBleHBlY3Qod3JpdGVGaWxlU3R1Yi5jYWxsQ291bnQpLnRvLmVxdWFsKDApXG5cbiAgICBkZXNjcmliZSAnV2hlbiBhIGpzIGZpbGVzIGlzIHRyYW5zcGlsZWQgYW5kIGdldHMgYW4gZXJyb3InLCAtPlxuICAgICAgaXQgJ2l0IGlzc3VlcyBhIG5vdGlmaWNhdGlvbiBlcnJvciBtZXNzYWdlJywgLT5cbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFtfX2Rpcm5hbWVdKVxuICAgICAgICBjb25maWcuYmFiZWxTb3VyY2VQYXRoID0gJ2ZpeHR1cmVzJ1xuICAgICAgICBjb25maWcuYmFiZWxUcmFuc3BpbGVQYXRoID0gJ2ZpeHR1cmVzJ1xuICAgICAgICBjb25maWcuYmFiZWxNYXBzUGF0aCA9ICdmaXh0dXJlcydcblxuICAgICAgICBzcHlPbihsYiwgJ2dldENvbmZpZycpLmFuZENhbGxGYWtlIC0+Y29uZmlnXG4gICAgICAgIGxiLnRyYW5zcGlsZShwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMvZGlyYS9kaXJhLjEvZGlyYS4yL2JhZC5qcycpKVxuICAgICAgICAjbWF5IHRha2UgYSB3aGlsZSBmb3IgdGhlIHRyYW5zcGlsZXIgdG8gcnVuIGFuZCBjYWxsIGhvbWVcbiAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICBub3RpZmljYXRpb25TcHkuY2FsbENvdW50XG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3Qobm90aWZpY2F0aW9uU3B5LmNhbGxDb3VudCkudG8uZXF1YWwoMSlcbiAgICAgICAgICBtc2cgPSBub3RpZmljYXRpb25TcHkuY2FsbHNbMF0uYXJnc1swXS5tZXNzYWdlXG4gICAgICAgICAgZXhwZWN0KG1zZykudG8ubWF0Y2goL15MQjogQmFiZWwuKlRyYW5zcGlsZXIgRXJyb3IvKVxuICAgICAgICAgIGV4cGVjdCh3cml0ZUZpbGVTdHViLmNhbGxDb3VudCkudG8uZXF1YWwoMClcblxuICAgIGRlc2NyaWJlICdXaGVuIGEganMgZmlsZSBzYXZlZCBidXQgbm8gb3V0cHV0IGlzIHNldCcsIC0+XG4gICAgICBpdCAnY2FsbHMgdGhlIHRyYW5zcGlsZXIgYnV0IGRvZXNudCBzYXZlIG91dHB1dCcsIC0+XG4gICAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhbX19kaXJuYW1lXSlcbiAgICAgICAgY29uZmlnLmJhYmVsU291cmNlUGF0aCA9ICdmaXh0dXJlcydcbiAgICAgICAgY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aCA9ICdmaXh0dXJlcydcbiAgICAgICAgY29uZmlnLmJhYmVsTWFwc1BhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5jcmVhdGVUcmFuc3BpbGVkQ29kZSA9IGZhbHNlXG5cbiAgICAgICAgc3B5T24obGIsICdnZXRDb25maWcnKS5hbmRDYWxsRmFrZSAtPmNvbmZpZ1xuICAgICAgICBsYi50cmFuc3BpbGUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2RpcmEvZGlyYS4xL2RpcmEuMi9yZWFjdC5qc3gnKSlcbiAgICAgICAgI21heSB0YWtlIGEgd2hpbGUgZm9yIHRoZSB0cmFuc3BpbGVyIHRvIHJ1biBhbmQgY2FsbCBob21lXG4gICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgbm90aWZpY2F0aW9uU3B5LmNhbGxDb3VudCA+IDFcbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdChub3RpZmljYXRpb25TcHkuY2FsbENvdW50KS50by5lcXVhbCgyKVxuICAgICAgICAgIG1zZyA9IG5vdGlmaWNhdGlvblNweS5jYWxsc1swXS5hcmdzWzBdLm1lc3NhZ2VcbiAgICAgICAgICBleHBlY3QobXNnKS50by5tYXRjaCgvXkxCOiBCYWJlbC4qVHJhbnNwaWxlciBTdWNjZXNzLylcbiAgICAgICAgICBtc2cgPSBub3RpZmljYXRpb25TcHkuY2FsbHNbMV0uYXJnc1swXS5tZXNzYWdlXG4gICAgICAgICAgZXhwZWN0KG1zZykudG8ubWF0Y2goL15MQjogTm8gdHJhbnNwaWxlZCBvdXRwdXQgY29uZmlndXJlZC8pXG4gICAgICAgICAgZXhwZWN0KHdyaXRlRmlsZVN0dWIuY2FsbENvdW50KS50by5lcXVhbCgwKVxuXG5cbiAgICBkZXNjcmliZSAnV2hlbiBhIGpzIGZpbGUgc2F2ZWQgYnV0IG5vIHRyYW5zcGlsZSBwYXRoIGlzIHNldCcsIC0+XG4gICAgICBpdCAnY2FsbHMgdGhlIHRyYW5zcGlsZXIgYW5kIHRyYW5zcGlsZXMgT0sgYnV0IGRvZXNudCBzYXZlIGFuZCBpc3N1ZXMgbXNnJywgLT5cbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFtfX2Rpcm5hbWVdKVxuICAgICAgICBjb25maWcuYmFiZWxTb3VyY2VQYXRoID0gJ2ZpeHR1cmVzJ1xuICAgICAgICBjb25maWcuYmFiZWxUcmFuc3BpbGVQYXRoID0gJ2ZpeHR1cmVzJ1xuICAgICAgICBjb25maWcuYmFiZWxNYXBzUGF0aCA9ICdmaXh0dXJlcydcblxuICAgICAgICBzcHlPbihsYiwgJ2dldENvbmZpZycpLmFuZENhbGxGYWtlIC0+Y29uZmlnXG4gICAgICAgIGxiLnRyYW5zcGlsZShwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMvZGlyYS9kaXJhLjEvZGlyYS4yL2dvb2QuanMnKSlcbiAgICAgICAgI21heSB0YWtlIGEgd2hpbGUgZm9yIHRoZSB0cmFuc3BpbGVyIHRvIHJ1biBhbmQgY2FsbCBob21lXG4gICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgbm90aWZpY2F0aW9uU3B5LmNhbGxDb3VudCA+IDFcbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdChub3RpZmljYXRpb25TcHkuY2FsbENvdW50KS50by5lcXVhbCgyKVxuICAgICAgICAgIG1zZyA9IG5vdGlmaWNhdGlvblNweS5jYWxsc1swXS5hcmdzWzBdLm1lc3NhZ2UgIyBmaXJzdCBjYWxsLCBmaXJzdCBhcmdcbiAgICAgICAgICBleHBlY3QobXNnKS50by5tYXRjaCgvXkxCOiBCYWJlbC4qVHJhbnNwaWxlciBTdWNjZXNzLylcbiAgICAgICAgICBtc2cgPSBub3RpZmljYXRpb25TcHkuY2FsbHNbMV0uYXJnc1swXS5tZXNzYWdlXG4gICAgICAgICAgZXhwZWN0KG1zZykudG8ubWF0Y2goL15MQjogVHJhbnNwaWxlZCBmaWxlIHdvdWxkIG92ZXJ3cml0ZSBzb3VyY2UgZmlsZS8pXG4gICAgICAgICAgZXhwZWN0KHdyaXRlRmlsZVN0dWIuY2FsbENvdW50KS50by5lcXVhbCgwKVxuXG4gICAgZGVzY3JpYmUgJ1doZW4gYSBqc3ggZmlsZSBzYXZlZCx0cmFuc3BpbGUgcGF0aCBpcyBzZXQsIHNvdXJjZSBtYXBzIGVuYWJsZWQnLCAtPlxuICAgICAgaXQgJ2NhbGxzIHRoZSB0cmFuc3BpbGVyIGFuZCB0cmFuc3BpbGVzIE9LLCBzYXZlcyBhcyAuanMgYW5kIGlzc3VlcyBtc2cnLCAtPlxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW19fZGlybmFtZV0pXG4gICAgICAgIGNvbmZpZy5iYWJlbFNvdXJjZVBhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5iYWJlbFRyYW5zcGlsZVBhdGggPSAnZml4dHVyZXMtdHJhbnNwaWxlZCdcbiAgICAgICAgY29uZmlnLmJhYmVsTWFwc1BhdGggPSAnZml4dHVyZXMtbWFwcydcbiAgICAgICAgY29uZmlnLmNyZWF0ZU1hcCA9IHRydWVcblxuICAgICAgICBzcHlPbihsYiwgJ2dldENvbmZpZycpLmFuZENhbGxGYWtlIC0+Y29uZmlnXG4gICAgICAgIGxiLnRyYW5zcGlsZShwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMvZGlyYS9kaXJhLjEvZGlyYS4yL3JlYWN0LmpzeCcpKVxuICAgICAgICAjbWF5IHRha2UgYSB3aGlsZSBmb3IgdGhlIHRyYW5zcGlsZXIgdG8gcnVuIGFuZCBjYWxsIGhvbWVcbiAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICB3cml0ZUZpbGVTdHViLmNhbGxDb3VudFxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZXhwZWN0KG5vdGlmaWNhdGlvblNweS5jYWxsQ291bnQpLnRvLmVxdWFsKDEpXG4gICAgICAgICAgbXNnID0gbm90aWZpY2F0aW9uU3B5LmNhbGxzWzBdLmFyZ3NbMF0ubWVzc2FnZSAjIGZpcnN0IGNhbGwsIGZpcnN0IGFyZ1xuICAgICAgICAgIGV4cGVjdChtc2cpLnRvLm1hdGNoKC9eTEI6IEJhYmVsLipUcmFuc3BpbGVyIFN1Y2Nlc3MvKVxuICAgICAgICAgIGV4cGVjdCh3cml0ZUZpbGVTdHViLmNhbGxDb3VudCkudG8uZXF1YWwoMilcbiAgICAgICAgICBzYXZlZEZpbGVuYW1lID0gd3JpdGVGaWxlU3R1Yi5jYWxsc1swXS5hcmdzWzBdXG4gICAgICAgICAgZXhwZWN0ZWRGaWxlTmFtZSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdmaXh0dXJlcy10cmFuc3BpbGVkL2RpcmEvZGlyYS4xL2RpcmEuMi9yZWFjdC5qcycpXG4gICAgICAgICAgZXhwZWN0KHNhdmVkRmlsZW5hbWUpLnRvLmVxdWFsKGV4cGVjdGVkRmlsZU5hbWUpXG4gICAgICAgICAgc2F2ZWRGaWxlbmFtZSA9IHdyaXRlRmlsZVN0dWIuY2FsbHNbMV0uYXJnc1swXVxuICAgICAgICAgIGV4cGVjdGVkRmlsZU5hbWUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMtbWFwcy9kaXJhL2RpcmEuMS9kaXJhLjIvcmVhY3QuanMubWFwJylcbiAgICAgICAgICBleHBlY3Qoc2F2ZWRGaWxlbmFtZSkudG8uZXF1YWwoZXhwZWN0ZWRGaWxlTmFtZSlcblxuICAgIGRlc2NyaWJlICdXaGVuIGEganN4IGZpbGUgc2F2ZWQsdHJhbnNwaWxlIHBhdGggaXMgc2V0LCBzb3VyY2UgbWFwcyBlbmFibGVkLCBzdWNjZXNzIHN1cHByZXNzZWQnLCAtPlxuICAgICAgaXQgJ2NhbGxzIHRoZSB0cmFuc3BpbGVyIGFuZCB0cmFuc3BpbGVzIE9LLCBzYXZlcyBhcyAuanMgYW5kIGlzc3VlcyBtc2cnLCAtPlxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW19fZGlybmFtZV0pXG4gICAgICAgIGNvbmZpZy5iYWJlbFNvdXJjZVBhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5iYWJlbFRyYW5zcGlsZVBhdGggPSAnZml4dHVyZXMtdHJhbnNwaWxlZCdcbiAgICAgICAgY29uZmlnLmJhYmVsTWFwc1BhdGggPSAnZml4dHVyZXMtbWFwcydcbiAgICAgICAgY29uZmlnLmNyZWF0ZU1hcCA9IHRydWVcbiAgICAgICAgY29uZmlnLnN1cHByZXNzVHJhbnNwaWxlT25TYXZlTWVzc2FnZXMgPSB0cnVlXG5cbiAgICAgICAgc3B5T24obGIsICdnZXRDb25maWcnKS5hbmRDYWxsRmFrZSAtPmNvbmZpZ1xuICAgICAgICBsYi50cmFuc3BpbGUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2RpcmEvZGlyYS4xL2RpcmEuMi9yZWFjdC5qc3gnKSlcbiAgICAgICAgI21heSB0YWtlIGEgd2hpbGUgZm9yIHRoZSB0cmFuc3BpbGVyIHRvIHJ1biBhbmQgY2FsbCBob21lXG4gICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgd3JpdGVGaWxlU3R1Yi5jYWxsQ291bnRcbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdChub3RpZmljYXRpb25TcHkuY2FsbENvdW50KS50by5lcXVhbCgwKVxuICAgICAgICAgIGV4cGVjdCh3cml0ZUZpbGVTdHViLmNhbGxDb3VudCkudG8uZXF1YWwoMilcbiAgICAgICAgICBzYXZlZEZpbGVuYW1lID0gd3JpdGVGaWxlU3R1Yi5jYWxsc1swXS5hcmdzWzBdXG4gICAgICAgICAgZXhwZWN0ZWRGaWxlTmFtZSA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdmaXh0dXJlcy10cmFuc3BpbGVkL2RpcmEvZGlyYS4xL2RpcmEuMi9yZWFjdC5qcycpXG4gICAgICAgICAgZXhwZWN0KHNhdmVkRmlsZW5hbWUpLnRvLmVxdWFsKGV4cGVjdGVkRmlsZU5hbWUpXG4gICAgICAgICAgc2F2ZWRGaWxlbmFtZSA9IHdyaXRlRmlsZVN0dWIuY2FsbHNbMV0uYXJnc1swXVxuICAgICAgICAgIGV4cGVjdGVkRmlsZU5hbWUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMtbWFwcy9kaXJhL2RpcmEuMS9kaXJhLjIvcmVhY3QuanMubWFwJylcbiAgICAgICAgICBleHBlY3Qoc2F2ZWRGaWxlbmFtZSkudG8uZXF1YWwoZXhwZWN0ZWRGaWxlTmFtZSlcblxuICAgIGRlc2NyaWJlICdXaGVuIGEganMgZmlsZSBzYXZlZCAsIGJhYmVscmMgaW4gcGF0aCBhbmQgZmxhZyBkaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGggaXMgc2V0JywgLT5cbiAgICAgIGl0ICdjYWxscyB0aGUgdHJhbnNwaWxlcicsIC0+XG4gICAgICAgIGF0b20ucHJvamVjdC5zZXRQYXRocyhbX19kaXJuYW1lXSlcbiAgICAgICAgY29uZmlnLmJhYmVsU291cmNlUGF0aCA9ICdmaXh0dXJlcydcbiAgICAgICAgY29uZmlnLmJhYmVsVHJhbnNwaWxlUGF0aCA9ICdmaXh0dXJlcydcbiAgICAgICAgY29uZmlnLmJhYmVsTWFwc1BhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5jcmVhdGVUcmFuc3BpbGVkQ29kZSA9IGZhbHNlXG4gICAgICAgIGNvbmZpZy5kaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGggPSB0cnVlXG5cbiAgICAgICAgc3B5T24obGIsICdnZXRDb25maWcnKS5hbmRDYWxsRmFrZSAtPmNvbmZpZ1xuICAgICAgICBsYi50cmFuc3BpbGUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2RpcmEvZGlyYS4xL2RpcmEuMi9nb29kLmpzJykpXG4gICAgICAgICNtYXkgdGFrZSBhIHdoaWxlIGZvciB0aGUgdHJhbnNwaWxlciB0byBydW4gYW5kIGNhbGwgaG9tZVxuICAgICAgICB3YWl0c0ZvciAtPlxuICAgICAgICAgIG5vdGlmaWNhdGlvblNweS5jYWxsQ291bnRcbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdChub3RpZmljYXRpb25TcHkuY2FsbENvdW50KS50by5lcXVhbCgyKVxuICAgICAgICAgIG1zZyA9IG5vdGlmaWNhdGlvblNweS5jYWxsc1swXS5hcmdzWzBdLm1lc3NhZ2VcbiAgICAgICAgICBleHBlY3QobXNnKS50by5tYXRjaCgvXkxCOiBCYWJlbC4qVHJhbnNwaWxlciBTdWNjZXNzLylcbiAgICAgICAgICBtc2cgPSBub3RpZmljYXRpb25TcHkuY2FsbHNbMV0uYXJnc1swXS5tZXNzYWdlXG4gICAgICAgICAgZXhwZWN0KG1zZykudG8ubWF0Y2goL15MQjogTm8gdHJhbnNwaWxlZCBvdXRwdXQgY29uZmlndXJlZC8pXG4gICAgICAgICAgZXhwZWN0KHdyaXRlRmlsZVN0dWIuY2FsbENvdW50KS50by5lcXVhbCgwKVxuXG4gICAgZGVzY3JpYmUgJ1doZW4gYSBqcyBmaWxlIHNhdmVkICwgYmFiZWxyYyBpbiBub3QgaW4gcGF0aCBhbmQgZmxhZyBkaXNhYmxlV2hlbk5vQmFiZWxyY0ZpbGVJblBhdGggaXMgc2V0JywgLT5cbiAgICAgIGl0ICdkb2VzIG5vdGhpbmcnLCAtPlxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW19fZGlybmFtZV0pXG4gICAgICAgIGNvbmZpZy5iYWJlbFNvdXJjZVBhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5iYWJlbFRyYW5zcGlsZVBhdGggPSAnZml4dHVyZXMnXG4gICAgICAgIGNvbmZpZy5iYWJlbE1hcHNQYXRoID0gJ2ZpeHR1cmVzJ1xuICAgICAgICBjb25maWcuY3JlYXRlVHJhbnNwaWxlZENvZGUgPSBmYWxzZVxuICAgICAgICBjb25maWcuZGlzYWJsZVdoZW5Ob0JhYmVscmNGaWxlSW5QYXRoID0gdHJ1ZVxuXG4gICAgICAgIHNweU9uKGxiLCAnZ2V0Q29uZmlnJykuYW5kQ2FsbEZha2UgLT5jb25maWdcbiAgICAgICAgbGIudHJhbnNwaWxlKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdmaXh0dXJlcy9kaXJiL2dvb2QuanMnKSlcbiAgICAgICAgZXhwZWN0KG5vdGlmaWNhdGlvblNweS5jYWxsQ291bnQpLnRvLmVxdWFsKDApXG4gICAgICAgIGV4cGVjdCh3cml0ZUZpbGVTdHViLmNhbGxDb3VudCkudG8uZXF1YWwoMClcblxuICAgIGRlc2NyaWJlICdXaGVuIGEganMgZmlsZSBzYXZlZCBpbiBhIG5lc3RlZCBwcm9qZWN0JywgLT5cbiAgICAgIGl0ICdjcmVhdGVzIGEgZmlsZSBpbiB0aGUgY29ycmVjdCBsb2NhdGlvbiBiYXNlZCB1cG9uIC5sYW5ndWFnZWJhYmVsJywgLT5cbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKFtfX2Rpcm5hbWVdKVxuICAgICAgICBjb25maWcuYWxsb3dMb2NhbE92ZXJyaWRlID0gdHJ1ZVxuXG4gICAgICAgIHNweU9uKGxiLCAnZ2V0Q29uZmlnJykuYW5kQ2FsbEZha2UgLT4gY29uZmlnXG4gICAgICAgIHNvdXJjZUZpbGUgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZml4dHVyZXMvcHJvamVjdFJvb3Qvc3JjL3Rlc3QuanMnKVxuICAgICAgICB0YXJnZXRGaWxlID0gIHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdmaXh0dXJlcy9wcm9qZWN0Um9vdC90ZXN0LmpzJylcbiAgICAgICAgbGIudHJhbnNwaWxlKHNvdXJjZUZpbGUpXG4gICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgd3JpdGVGaWxlU3R1Yi5jYWxsQ291bnRcbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGV4cGVjdCh3cml0ZUZpbGVOYW1lKS50by5lcXVhbCh0YXJnZXRGaWxlKVxuXG4gICAgZGVzY3JpYmUgJ1doZW4gYSBkaXJlY3RvcnkgaXMgY29tcGlsZWQnLCAtPlxuICAgICAgaXQgJ3RyYW5zcGlsZXMgdGhlIGpzLGpzeCxlcyxlczYsYmFiZWwgZmlsZXMgYnV0IGlnbm9yZXMgbWluaWZpZWQgZmlsZXMnLCAtPlxuICAgICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMoW19fZGlybmFtZV0pXG4gICAgICAgIGNvbmZpZy5hbGxvd0xvY2FsT3ZlcnJpZGUgPSB0cnVlXG5cbiAgICAgICAgc3B5T24obGIsICdnZXRDb25maWcnKS5hbmRDYWxsRmFrZSAtPiBjb25maWdcbiAgICAgICAgc291cmNlRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL3Byb2plY3RSb290L3NyYy8nKVxuICAgICAgICBsYi50cmFuc3BpbGVEaXJlY3Rvcnkoe2RpcmVjdG9yeTogc291cmNlRGlyfSlcbiAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICB3cml0ZUZpbGVTdHViLmNhbGxDb3VudCA+PSA1XG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBleHBlY3Qod3JpdGVGaWxlU3R1Yi5jYWxsQ291bnQpLnRvLmVxdWFsKDUpXG4iXX0=
