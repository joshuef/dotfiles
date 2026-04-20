self: super: {
  # Override stripe-cli to a newer version than nixpkgs currently ships.
  # Remove this overlay once nixpkgs catches up to >= 1.40.6.
  stripe-cli = super.stripe-cli.overrideAttrs (old: rec {
    version = "1.40.6";
    src = super.fetchFromGitHub {
      owner = "stripe";
      repo = "stripe-cli";
      tag = "v${version}";
      hash = "sha256-L47o+bMwzHXDkvTlFP9ys+2qDB2OHiN0kiumgOP5s+o=";
    };
    vendorHash = "sha256-hezLd9H5ewsSC6+ycT86UV7m/2BJzoQUGLjGpuYwmYU=";
    ldflags = [
      "-s"
      "-w"
      "-X github.com/stripe/stripe-cli/pkg/version.Version=${version}"
    ];
  });
}
