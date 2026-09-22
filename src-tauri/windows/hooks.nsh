!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe" "" "Doclight"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe" "FriendlyAppName" "Doclight"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\DefaultIcon" "" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".docx" ""
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".txt" ""
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".md" ""
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".markdown" ""

  WriteRegStr SHCTX "Software\Classes\.docx\OpenWithProgids" "Doclight.Docx" ""
  WriteRegStr SHCTX "Software\Classes\.txt\OpenWithProgids" "Doclight.Txt" ""
  WriteRegStr SHCTX "Software\Classes\.md\OpenWithProgids" "Doclight.Markdown" ""
  WriteRegStr SHCTX "Software\Classes\.markdown\OpenWithProgids" "Doclight.Markdown" ""

  WriteRegStr SHCTX "Software\Classes\.docx\OpenWithList\${MAINBINARYNAME}.exe" "" ""
  WriteRegStr SHCTX "Software\Classes\.txt\OpenWithList\${MAINBINARYNAME}.exe" "" ""
  WriteRegStr SHCTX "Software\Classes\.md\OpenWithList\${MAINBINARYNAME}.exe" "" ""
  WriteRegStr SHCTX "Software\Classes\.markdown\OpenWithList\${MAINBINARYNAME}.exe" "" ""

  WriteRegStr SHCTX "Software\Doclight\Capabilities" "ApplicationName" "Doclight"
  WriteRegStr SHCTX "Software\Doclight\Capabilities" "ApplicationDescription" "A lightweight, minimal local document editor"
  WriteRegStr SHCTX "Software\Doclight\Capabilities" "ApplicationIcon" "$INSTDIR\${MAINBINARYNAME}.exe,0"
  WriteRegStr SHCTX "Software\Doclight\Capabilities\FileAssociations" ".docx" "Doclight.Docx"
  WriteRegStr SHCTX "Software\Doclight\Capabilities\FileAssociations" ".txt" "Doclight.Txt"
  WriteRegStr SHCTX "Software\Doclight\Capabilities\FileAssociations" ".md" "Doclight.Markdown"
  WriteRegStr SHCTX "Software\Doclight\Capabilities\FileAssociations" ".markdown" "Doclight.Markdown"
  WriteRegStr SHCTX "Software\RegisteredApplications" "Doclight" "Software\Doclight\Capabilities"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe"
  DeleteRegValue SHCTX "Software\Classes\.docx\OpenWithProgids" "Doclight.Docx"
  DeleteRegValue SHCTX "Software\Classes\.txt\OpenWithProgids" "Doclight.Txt"
  DeleteRegValue SHCTX "Software\Classes\.md\OpenWithProgids" "Doclight.Markdown"
  DeleteRegValue SHCTX "Software\Classes\.markdown\OpenWithProgids" "Doclight.Markdown"
  DeleteRegKey SHCTX "Software\Classes\.docx\OpenWithList\${MAINBINARYNAME}.exe"
  DeleteRegKey SHCTX "Software\Classes\.txt\OpenWithList\${MAINBINARYNAME}.exe"
  DeleteRegKey SHCTX "Software\Classes\.md\OpenWithList\${MAINBINARYNAME}.exe"
  DeleteRegKey SHCTX "Software\Classes\.markdown\OpenWithList\${MAINBINARYNAME}.exe"
  DeleteRegKey SHCTX "Software\Doclight"
  DeleteRegValue SHCTX "Software\RegisteredApplications" "Doclight"
!macroend
