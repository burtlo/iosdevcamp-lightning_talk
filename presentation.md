!SLIDE title

# Ruby
as a second language

!SLIDE

This is in fact an ios dev camp. A camp dedicated to the beautiful programming language Objective-C. It is a language that I grew to understand and I would
admit through an act of Stockholm Syndrome have come to love the language in
its own quirky way.

!SLIDE

More specifically I love the effect of what you can accomplish with Objective-C. Creating and building iOS applications beautiful and admittedly they do make it possible to do some very sexy things with animations and core functionality.

However, there are two things I will never love about working with iOS project.

!SLIDE

The first is all the clicking involved in the development.
Particularlly, again this is related to manipulating the project file to add
new files, manage targets, etc. So many tutorials describe clicking here and dragging. Opening specifically menus and finding specific tabs that need to be
manipulated.

!SLIDE

And the second is specifically Xcode or more specifically working with Xcode project files. Generally this is the reason for the most amounts of clicking. The xcode editor is in some cases a necessary evil to do work with the verbose and tedious to type frameworks.

Installing and sharing code is a nightmare.

!SLIDE

So lets talk about how ruby solves these problems of this clicking.

!SLIDE

# Cocoapods

http://cocoapods.org/
https://github.com/CocoaPods/CocoaPods

```ruby
platform :ios, '6.0'
pod 'JSONKit',       '~> 1.4'
pod 'Reachability',  '~> 3.0.0'
```

First, and probably the most prominent, is Cocoapods. Which is a dependency manager that allows you to define and retrieve all the libraries you need to
make your great applications. This application is written exclusively in ruby.

!SLIDE

# xcoder

This is a second tool that allows you to build, ship and test your application from the command-line. With support to deploy to ftp, ssh, s3 and testflight.

https://github.com/rayh/xcoder

!SLIDE

# Rakefile

```ruby
require 'xcoder/rake_task'

Xcode::RakeTask.new
```

```
rake xcode:babygram:babygram:debug:build            # Build Babygram Babygram Debug
rake xcode:babygram:babygram:debug:clean            # Clean Babygram Babygram Debug
rake xcode:babygram:babygram:debug:package          # Package Babygram Babygram Debug
rake xcode:babygram:babygram:debug:test             # Test Babygram Babygram Debug
rake xcode:babygram:babygram:release:build          # Build Babygram Babygram Release
rake xcode:babygram:babygram:release:clean          # Clean Babygram Babygram Release
...
```

.notes Similar to the functionality to what you expect from `xctool` for building, testing and delivering your project.

https://github.com/facebook/xctool

!SLIDE

# xcoder

```ruby
# Copy the physical source files into the project path `Vendor/Reachability`
FileUtils.cp_r "examples/Reachability/Vendor", "spec/TestProject"

source_files = [ 'Vendor/Reachability/Reachability.m' , 'Vendor/Reachability/Reachability.h' ]

# Create and traverse to the group Reachability within the Vendor folder
project.group('Vendor/Reachability') do
 # Create files for each source file defined above
 source_files.each |source| create_file source }
end
```

There are also features that allow you to dynamically modify your xcode project
file. Perhaps you are using continuous integration to build your product and
deliver to your beta customers and you want to insert or replace files necessary
for the production application. Similar to `Xcodeproj`, xcoder allows you to
manipulate an xcode project file.

!SLIDE


Convert this 14 step process into a simple script that could generate a universal
target from your project and release that as its own tool.

Convert this long list of clicks and settings into a simple script which will  generate a universal framework.

https://github.com/jverkoey/iOS-Framework

!SLIDE

```ruby

project.create_target 'Library', :bundle do |target|

  target.create_build_phase :sources do |source|
    source.add_build_file project.file('TestProject/AppDelegate.m')
  end

  target.create_build_phase :copy_headers do |headers|
    headers.add_build_file_with_public_privacy project.file('TestProject/AppDelegate.h')
    headers.add_build_file project.file('TestProject/Supporting Files/TestProject-Prefix.pch')
  end

  target.create_configurations :release do |config|
    config.always_search_user_paths = false
    config.architectures = [ "$(ARCHS_STANDARD_32_BIT)", 'armv6' ]
    config.copy_phase_strip = true
    config.dead_code_stripping = false
    config.debug_information_format = "dwarf-with-dsym"
    config.c_language_standard = 'gnu99'
    config.enable_objc_exceptions = true
    config.generate_debugging_symbols = false
    config.precompile_prefix_headers = false
    config.gcc_version = 'com.apple.compilers.llvm.clang.1_0'
    config.warn_64_to_32_bit_conversion = true
    config.warn_about_missing_prototypes = true
    config.install_path = "$(LOCAL_LIBRARY_DIR)/Bundles"
    config.link_with_standard_libraries = false
    config.mach_o_type = 'mh_object'
    config.macosx_deployment_target = '10.7'
    config.product_name = '$(TARGET_NAME)'
    config.sdkroot = 'iphoneos'
    config.valid_architectures = '$(ARCHS_STANDARD_32_BIT)'
    config.wrapper_extension = 'framework'
    config.info_plist_location = ""
    config.prefix_header = ""
    config.save!
  end

end
```

!SLIDE

```ruby
project.create_target('Universal Library',:aggregate) do |target|

  target.product_name = 'Univeral Library'

  target.add_dependency project.target('Library')

  target.create_configurations :release

  target.create_build_phase :run_script do |script|
    script.shell_script = "# Sets the target folders and the final framework product.\nFMK_NAME=Library\nFMK_VERSION=A\n\n# Install dir will be the final output to the framework.\n# The following line create it in the root folder of the current project.\nINSTALL_DIR=${SRCROOT}/Products/${FMK_NAME}.framework\n\n# Working dir will be deleted after the framework creation.\nWRK_DIR=build\nDEVICE_DIR=${WRK_DIR}/Release-iphoneos/${FMK_NAME}.framework\nSIMULATOR_DIR=${WRK_DIR}/Release-iphonesimulator/${FMK_NAME}.framework\n\n# Building both architectures.\nxcodebuild -configuration \"Release\" -target \"${FMK_NAME}\" -sdk iphoneos\nxcodebuild -configuration \"Release\" -target \"${FMK_NAME}\" -sdk iphonesimulator\n\n# Cleaning the oldest.\nif [ -d \"${INSTALL_DIR}\" ]\nthen\nrm -rf \"${INSTALL_DIR}\"\nfi\n\n# Creates and renews the final product folder.\nmkdir -p \"${INSTALL_DIR}\"\nmkdir -p \"${INSTALL_DIR}/Versions\"\nmkdir -p \"${INSTALL_DIR}/Versions/${FMK_VERSION}\"\nmkdir -p \"${INSTALL_DIR}/Versions/${FMK_VERSION}/Resources\"\nmkdir -p \"${INSTALL_DIR}/Versions/${FMK_VERSION}/Headers\"\n\n# Creates the internal links.\n# It MUST uses relative path, otherwise will not work when the folder is copied/moved.\nln -s \"${FMK_VERSION}\" \"${INSTALL_DIR}/Versions/Current\"\nln -s \"Versions/Current/Headers\" \"${INSTALL_DIR}/Headers\"\nln -s \"Versions/Current/Resources\" \"${INSTALL_DIR}/Resources\"\nln -s \"Versions/Current/${FMK_NAME}\" \"${INSTALL_DIR}/${FMK_NAME}\"\n\n# Copies the headers and resources files to the final product folder.\ncp -R \"${DEVICE_DIR}/Headers/\" \"${INSTALL_DIR}/Versions/${FMK_VERSION}/Headers/\"\ncp -R \"${DEVICE_DIR}/\" \"${INSTALL_DIR}/Versions/${FMK_VERSION}/Resources/\"\n\n# Removes the binary and header from the resources folder.\nrm -r \"${INSTALL_DIR}/Versions/${FMK_VERSION}/Resources/Headers\" \"${INSTALL_DIR}/Versions/${FMK_VERSION}/Resources/${FMK_NAME}\"\n\n# Uses the Lipo Tool to merge both binary files (i386 + armv6/armv7) into one Universal final product.\nlipo -create \"${DEVICE_DIR}/${FMK_NAME}\" \"${SIMULATOR_DIR}/${FMK_NAME}\" -output \"${INSTALL_DIR}/Versions/${FMK_VERSION}/${FMK_NAME}\"\n\nrm -r \"${WRK_DIR}\""
  end

end

project.save!
```

!SLIDE

The most recent example of how I used xcoder was for the website exercism.io.
Exercism is website that originally intended to teach you how to be a better (ruby)
developer. It has since expanded to include JavaScript, Elixir, Clojure...

!SLIDE

We wanted to add Objective-C but we wanted to make it easy for people to get started with
objective-c. We wanted to focus on the language and not as much time configuring
Xcode.

http://exercism.io/setup/objective-c

!SLIDE

```
Creating the project in Xcode:

Start Xcode create a new project.
Select OSX-->Application and then Command Line Tool.
Click Next and give it a project name using the ExerciseName is advised.
Select Foundation at the bottom from the drop down menu.
Click Next until the wizard is finished.
Now that the project is created click on Editor-->Add Target.
Select OSX-->Other and select Cocoa Unit Testing Bundle.
Ensure it's of type XCTest and that the project and target match then click finish.
Open the new file which will be named ExerciseName_Tests.m in a folder called ExerciseName Tests and replace the contents with the test file you got from exercism.
Create a new file with the correct name for the exercise.
Click on your project in the left hand pane.
Select Build Phases on the right.
Ensure that XCTest.framework exists under Link Binary With Libraries.
Add your .m files to the compile sources list.
Then use CMD-U to run the tests when you're ready.
```

!SLIDE

# objc

Creating `objc` a tool which automatically creates a test project from a source file name. Which we use in **exercism.io** to provide a tool which makes it easier to get into building test driven Objective-C applications

Objc packages a nearly complete project file that simply inserts your source and header files
into the project when you run the command. Turning that entire long list of instructions
for everyone of the test into a simple command:

!SLIDE

```
objc Bob
```

!SLIDE

# RubyMotion

http://www.rubymotion.com/

```objectiv-c
[button addTarget:self action:@selector(buttonTapped:) forControlEvents: UIControlEventTouchUpInside];

//  Elsewhere

- (void)buttonTapped:(id)sender {
    self.view.backgroundColor = [UIColor redColor];
}
```

```ruby
button.when(UIControlEventTouchUpInside) do
  self.view.backgroundColor = UIColor.redColor
end
```

http://clayallsopp.com/posts/the-ruby-motion-way/
https://gist.github.com/burtlo/5719253

An added bonus of ruby is that eventually could take advantage of some of the
awesome advances that are taking place towards efficiency in RubyMotion.

!SLIDE

Again I am strong proponent to using Objective-C when building iOS applications.
But when I look for tooling and ways to make my life easier I look at Ruby to
provide me with amazing tools that chnage

When I am building the next greatest game or the social experience that brings us
together I choose to use objective-C and iOS.


!SLIDE

Cocoapods
Xcoder
Exercism.io (ruby and objective-c)

The language that helps me make that job easier is Ruby.
