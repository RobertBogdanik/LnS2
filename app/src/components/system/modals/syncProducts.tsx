"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeepSyncStore } from "@/context/deepSync"
import { Progress } from "@/components/ui/progress"

export function DeepSyncDialog() {
  const { isOpen, syncStep, stepProgress } = useDeepSyncStore();

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pełna synchronizacja bazy danych</AlertDialogTitle>
          <AlertDialogDescription>

            <div>
              <Progress value={stepProgress} className="w-full" />
              <span className="text-muted-foreground text-sm">
                {syncStep === 1 && "Pobieranie danych..."}
                {syncStep === 2 && "Czyszczenie danych..."}
                {syncStep === 3 && "Przetwarzanie danych..."}
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// "use client"

// import * as React from "react"


// export function ProgressDemo() {
//   const [progress, setProgress] = React.useState(13)

//   React.useEffect(() => {
//     const timer = setTimeout(() => setProgress(66), 500)
//     return () => clearTimeout(timer)
//   }, [])

//   return <Progress value={progress} className="w-[60%]" />
// }
