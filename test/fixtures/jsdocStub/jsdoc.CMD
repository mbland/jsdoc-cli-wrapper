:: This Source Code Form is subject to the terms of the Mozilla Public
:: License, v. 2.0. If a copy of the MPL was not distributed with this
:: file, You can obtain one at https://mozilla.org/MPL/2.0/.
::
:: https://stackoverflow.com/questions/11269338/how-to-comment-out-add-comment-in-a-batch-cmd
:: https://stackoverflow.com/questions/5034076/what-does-dp0-mean-and-how-does-it-work
:: https://ss64.com/nt/
:: https://htipe.wordpress.com/2008/10/09/the-dp0-variable/
@echo off
node "%~dp0\jsdoc" %*
