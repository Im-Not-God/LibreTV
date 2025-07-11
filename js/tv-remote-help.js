/**
 * TV遥控器快捷键帮助系统
 */

function showTVRemoteHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-50';
    helpModal.innerHTML = `
        <div class="bg-[#111] p-8 rounded-lg border border-[#333] max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-2xl font-bold gradient-text mb-6 text-center">TV遥控器快捷键</h2>
            <div class="space-y-4 text-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-blue-400 mb-2">基本导航</h3>
                        <ul class="space-y-1 text-sm">
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">方向键</kbd> 导航</li>
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">Enter</kbd> 确认选择</li>
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">Escape</kbd> 返回/关闭</li>
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">Space</kbd> 确认/播放</li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-blue-400 mb-2">快速导航</h3>
                        <ul class="space-y-1 text-sm">
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">Home</kbd> 跳到第一项</li>
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">End</kbd> 跳到最后一项</li>
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">数字键</kbd> 快速选择结果</li>
                            <li><kbd class="bg-gray-700 px-2 py-1 rounded">字母键</kbd> 快速搜索</li>
                        </ul>
                    </div>
                </div>
                <div class="mt-6 p-4 bg-[#1a1a1a] rounded-lg">
                    <h3 class="text-lg font-semibold text-green-400 mb-2">提示</h3>
                    <ul class="space-y-1 text-sm">
                        <li>• 在搜索框中输入关键词后按Enter搜索</li>
                        <li>• 使用数字键1-9快速选择搜索结果</li>
                        <li>• 在播放器中使用空格键暂停/播放</li>
                        <li>• 按Escape键可以逐层返回到上一级</li>
                    </ul>
                </div>
            </div>
            <div class="mt-6 text-center">
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focusable">
                    知道了
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(helpModal);
    
    // 聚焦到关闭按钮
    setTimeout(() => {
        const closeBtn = helpModal.querySelector('button');
        if (closeBtn) {
            closeBtn.focus();
        }
    }, 100);
}

// 添加帮助按钮到设置面板
document.addEventListener('DOMContentLoaded', function() {
    if (window.tvRemote && window.tvRemote.isEnabled) {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            const helpButton = document.createElement('button');
            helpButton.className = 'px-4 py-2 w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg focusable';
            helpButton.textContent = 'TV遥控器使用说明';
            helpButton.onclick = showTVRemoteHelp;
            
            // 添加到一般功能区域
            const generalSection = settingsPanel.querySelector('.space-y-5 > div:last-child');
            if (generalSection) {
                generalSection.appendChild(helpButton);
            }
        }
    }
});