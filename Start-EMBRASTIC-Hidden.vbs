Set WshShell = CreateObject("WScript.Shell")

WshShell.CurrentDirectory = "C:\Users\vshlt\embrastic"

WshShell.Run "cmd.exe /c npm run dev > embrastic-server.log 2>&1", 0, False