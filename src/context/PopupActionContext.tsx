import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type PopupAction = 'studentPortal' | 'learningPortal' | 'rewards' | 'notifications' | null;

interface PopupActionContextValue {
  popupAction: PopupAction;
  consumePopupAction: (action: Exclude<PopupAction, null>) => void;
}

const PopupActionContext = createContext<PopupActionContextValue>({
  popupAction: null,
  consumePopupAction: () => {},
});

export function PopupActionProvider({ children, action }: { children: React.ReactNode; action: PopupAction }) {
  const [popupAction, setPopupAction] = useState<PopupAction>(null);

  React.useEffect(() => {
    if (action) setPopupAction(action);
  }, [action]);

  const consumePopupAction = useCallback((consumed: Exclude<PopupAction, null>) => {
    setPopupAction((current) => current === consumed ? null : current);
  }, []);

  const value = useMemo(() => ({ popupAction, consumePopupAction }), [popupAction, consumePopupAction]);
  return <PopupActionContext.Provider value={value}>{children}</PopupActionContext.Provider>;
}

export function usePopupAction() {
  return useContext(PopupActionContext);
}
