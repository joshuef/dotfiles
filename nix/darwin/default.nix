{ config, pkgs, ... }:

let user = "josh"; in
{

  imports = [
    ./home-manager.nix
    ../shared
    ../shared/cachix
  ];

  # Auto upgrade nix package and the daemon service.

  # Setup user, packages, programs
  nix = {
    package = pkgs.nixVersions.latest;
    settings.trusted-users = [ "@admin" "${user}" ];

    gc = {
      automatic = true;
      interval = { Weekday = 0; Hour = 2; Minute = 0; };
      options = "--delete-older-than 30d";
    };

    # Turn this on to make command line easier
    extraOptions = ''
      experimental-features = nix-command flakes
    '';
  };

  # Turn off NIX_PATH warnings now that we're using flakes
  system.checks.verifyNixPath = false;

  # Fix nixbld group GID mismatch
  ids.gids.nixbld = 350;

  # Load configuration that is shared across systems
  environment.systemPackages = with pkgs; [
    # emacs-unstable
  ] ++ (import ../shared/packages.nix { inherit pkgs; });

  # launchd.user.agents.emacs.path = [ config.environment.systemPath ];
  # launchd.user.agents.emacs.serviceConfig = {
  #   KeepAlive = true;
  #   ProgramArguments = [
  #     "/bin/sh"
  #     "-c"
  #     "/bin/wait4path ${pkgs.emacs}/bin/emacs && exec ${pkgs.emacs}/bin/emacs --fg-daemon"
  #   ];
  #   StandardErrorPath = "/tmp/emacs.err.log";
  #   StandardOutPath = "/tmp/emacs.out.log";
  # };

  system = {
    stateVersion = 4;

    defaults = {
      LaunchServices = {
        LSQuarantine = false;
      };

      NSGlobalDomain = {
        AppleShowAllExtensions = true;
        ApplePressAndHoldEnabled = false;

        # Set sidebar icon size to medium
        NSTableViewDefaultSizeMode = 2;

        AppleShowScrollBars = "Always";
        # Disable the over-the-top focus ring animation
        NSUseAnimatedFocusRing = false;
        # 120, 90, 60, 30, 12, 6, 2
        KeyRepeat = 2;


        # 120, 94, 68, 35, 25, 15
        InitialKeyRepeat = 15;

        "com.apple.mouse.tapBehavior" = 1;
        "com.apple.sound.beep.volume" = 0.0;
        "com.apple.sound.beep.feedback" = 0;

        # Automatically quit printer app once the print jobs complete
        # "com.apple.print.PrintingPrefs Quit When Finished" = true;

        # Display ASCII control characters using caret notation in standard text views
        # Try e.g. `cd /tmp; unidecode "\x{0000}" > cc.txt; open -e cc.txt`
        "NSTextShowsControlCharacters" =  true;


        # Expand save panel by default
        NSNavPanelExpandedStateForSaveMode= true;
        NSNavPanelExpandedStateForSaveMode2= true;

      #   # Top right screen corner → Desktop
      # "com.apple.dock".wvous-tr-corner = 4;
      # "com.apple.dock".wvous-tr-modifier = 0;

      };

      dock = {
        autohide = true;
        show-recents = false;
        launchanim = true;
        orientation = "left";
        tilesize = 36;
      };

      finder = {
        _FXShowPosixPathInTitle = false;
      };

      trackpad = {
        Clicking = true;
        TrackpadThreeFingerDrag = true;
      };


    };

    keyboard = {
      enableKeyMapping = true;
      remapCapsLockToControl = true;
    };
  };
}
