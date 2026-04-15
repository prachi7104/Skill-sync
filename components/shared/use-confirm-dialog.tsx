"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
};

type ConfirmDialogState = ConfirmDialogOptions & {
  resolve: (confirmed: boolean) => void;
};

const DEFAULT_OPTIONS: Omit<ConfirmDialogOptions, "title"> = {
  description: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  confirmVariant: "default",
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState | null>(null);

  const closeDialog = useCallback((confirmed: boolean) => {
    setState((current) => {
      if (!current) return null;
      current.resolve(confirmed);
      return null;
    });
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...DEFAULT_OPTIONS,
        ...options,
        resolve,
      });
    });
  }, []);

  const ConfirmDialog = useMemo(
    () => (
      <Dialog open={Boolean(state)} onOpenChange={(open) => { if (!open) closeDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state?.title ?? "Confirm action"}</DialogTitle>
            {state?.description ? <DialogDescription>{state.description}</DialogDescription> : null}
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
              {state?.cancelText ?? "Cancel"}
            </Button>
            <Button
              type="button"
              variant={state?.confirmVariant ?? "default"}
              onClick={() => closeDialog(true)}
            >
              {state?.confirmText ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
    [closeDialog, state],
  );

  return {
    confirm,
    ConfirmDialog,
  };
}
