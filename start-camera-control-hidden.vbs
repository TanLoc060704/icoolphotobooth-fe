Option Explicit

Dim fileSystem, shell, projectDirectory, command

Set fileSystem = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

projectDirectory = fileSystem.GetParentFolderName(WScript.ScriptFullName)
command = "cmd.exe /d /s /c ""cd /d """ & projectDirectory & """ && npm run camera-control"""

' Window style 0 keeps the command window hidden. False starts it asynchronously.
shell.Run command, 0, False
