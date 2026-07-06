!macro preInit
    ${If} ${RunningX64}
        StrCpy $INSTDIR "$PROGRAMFILES64\TIFICO Tbk\Connect Drive"
    ${Else}
        StrCpy $INSTDIR "$PROGRAMFILES\TIFICO Tbk\Connect Drive"
    ${EndIf}
!macroend