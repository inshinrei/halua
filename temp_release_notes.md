## ver: nil

- changed:

1. webbrowserconsolehandler now uses .info for info level instead of .log
2. text handler now has "linked arguments flatten" options, that can be turned off
3. webbrowserconsolehandler now has "link arguments" options, that can be turned off
4. webbrowserconsolehandler renamed to webconsolehandler (breaking) (migration strat: rename)
5. linkedArgumentsFlatten renamed to linkArguments (breaking) (migration strat: rename)
6. Handler{} now only has to have log method (breaking) (migration strat: custom handler should ve define log method)
7. TextHandler now has replaceBeforeStringify option
8. TextHandler now has message format field, describing output order
9. WebConsoleHandler now has withSeparator options