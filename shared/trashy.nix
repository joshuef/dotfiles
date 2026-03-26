{ pkgs ? import <nixpkgs> {} }:

pkgs.buildRustPackage rec {
  pname = "trashy";
  version = "2.0.0";

  src = pkgs.fetchFromGitHub {
    owner = "oberblastmeister";
    repo = "trashy";
    rev = "v${version}"; # Use the tag for the version you want to build
    sha256 = ""; # You will fill this in after the first build attempt
  };

  cargoSha256 = ""; # You will also fill this in after the first build attempt

  meta = with pkgs.lib; {
    description = "A command line tool to move files to the trash";
    homepage = "https://github.com/oberblastmeister/trashy";
    license = licenses.mit;
    maintainers = [ maintainers.yourname ]; # Replace with your maintainer name
  };
}
