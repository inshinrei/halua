## ver: 25.1

- changed:

1. webbrowserconsolehandler now uses .info for info level instead of .log
2. webbrowserconsolehandler renamed to webconsolehandler (breaking) (migration strat: rename)
3. linkedArgumentsFlatten renamed to linkArguments (breaking) (migration strat: rename)
4. Handler{} now only has to have log method (breaking) (migration strat: custom handler should ve define log method)

- added:

1. WebConsoleHandler now has withSeparator options
2. TextHandler now has message format field, describing output order
3. TextHandler now has replaceBeforeStringify option
4. text handler now has "linked arguments flatten" options, that can be turned off
5. webbrowserconsolehandler now has "link arguments" options, that can be turned off
6. WebConsoleHandler now has message format field

pre-release notes:

- REWRITE DOCS IN README