/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { ipcMain } from 'electron';
import { createMessageConnection, DataCallback, Message, MessageReader, MessageWriter } from 'vscode-jsonrpc';

import { DisposableCollection, Disposable } from '@theia/core/lib/common/disposable';
import { Emitter } from '@theia/core/lib/common/event';

import { ELECTRON_IPC_CHANNEL_NAME } from '../../common/messaging/ipc-protocol';

// tslint:disable:no-any

const toDispose = new DisposableCollection();

// These objects are mostly unused
const errorEmitter = new Emitter<any>();
const closeEmitter = new Emitter<any>();
const partialEmitter = new Emitter<any>();

toDispose.pushAll([errorEmitter, closeEmitter, partialEmitter]);

/**
 * MessageConnection wrapper around the `ipcMain` object.
 */
export const ElectronIpcMainConnection = createMessageConnection({
    onError: errorEmitter.event,
    onClose: closeEmitter.event,
    onPartialMessage: partialEmitter.event,
    listen(callback: DataCallback): void {
        if (!toDispose.disposed) {
            ipcMain.on(ELECTRON_IPC_CHANNEL_NAME, callback);
            toDispose.push(Disposable.create(() => {
                ipcMain.removeListener(ELECTRON_IPC_CHANNEL_NAME, callback);
            }));
        }
    },
    dispose(): void {
        toDispose.dispose();
    },
} as MessageReader, {
    onClose: closeEmitter.event,
    onError: errorEmitter.event,
    write(message: Message): void {
        if (!toDispose.disposed) {
            ipcMain.emit(ELECTRON_IPC_CHANNEL_NAME, message);
        }
    },
    dispose(): void {
        toDispose.dispose();
    }
} as MessageWriter);