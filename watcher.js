console.clear()

const wGuid = w.general.renderTo 
const jGuid = '#' + wGuid  
const mainContainerId = `watcher_${wGuid}` 
const metaName = 'W4TCH3R'

const containWatcher = $(jGuid) 
 
const { getMetricsCurrent } = prxz.api.visi.final;
const { cronParser } = prxz.func.other
const { fdate } = prxz.frm.d   

const existingContainer = document.getElementById(mainContainerId)

if (!existingContainer) {
    getMetricsCurrent().then(v => { 
        if(v){
            console.log(v)
            initWATCHER(v) 
        }
    });
}

function initWATCHER(dataset){
    const styles = getStyles()
    startHTML(containWatcher, styles)
    renderCharts(mainContainerId, dataset)
}

function startHTML(cnt, styles){
    const html = `<div id="${mainContainerId}"></div>`
    
    cnt.empty().append(styles)
    cnt.append(html)
}

function getStyles(){
    const { fontFamily } = w.props
    
    const userFont = fontFamily
    
    return `
    <style>
        :root {
            --cyber-neon: #00ff88;
            --cyber-purple: #b536ff;
            --cyber-blue: #00d4ff;
            --cyber-pink: #ff2d95;
            --cyber-dark: #0a0a0f;
            --cyber-surface: #12121f;
            --cyber-border: #1e1e35;
            --text-primary: #f0f0ff;
            --text-secondary: #b8b8d0;
            --text-label: #8a8ab8;
            --text-dim: #a0a0c0;
            --cyber-warn: #ffb347;
        }
        
        #watcher_${wGuid}{
            width: 100%;
            height: 100%;
            color: var(--text-primary);
            overflow-y: auto;
            box-sizing: border-box;
            font-family: ${userFont};
            position: relative;
        }
        
        .${metaName}-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2px;
            background: linear-gradient(45deg, 
                rgba(0, 212, 255, 0.15),
                rgba(181, 54, 255, 0.15),
                rgba(0, 255, 136, 0.15)
            );
            border: 1px solid rgba(0, 212, 255, 0.25);
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            z-index: 2;
        }
        
        .${metaName}-cell {
            background: linear-gradient(135deg, 
                rgba(18, 18, 31, 0.97) 0%, 
                rgba(10, 10, 15, 0.99) 100%
            );
            padding: 14px 18px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
            position: relative;
            overflow: hidden;
        }
        
        .${metaName}-cell__head {
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(0, 212, 255, 0.15);
            padding-bottom: 12px;
        }
        
        .${metaName}-cell__dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
            position: relative;
        }
        
        .${metaName}-cell__dot--ds { 
            background: var(--cyber-blue); 
        }
        .${metaName}-cell__dot--sch { 
            background: var(--cyber-neon); 
        }
        .${metaName}-cell__dot--dash { 
            background: var(--cyber-purple); 
        }
        .${metaName}-cell__dot--tbl { 
            background: var(--cyber-pink); 
        }
        
        .${metaName}-cell__title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #ccccff;
            white-space: nowrap;
        }
        
        .${metaName}-cell__body {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .${metaName}-row {
            display: grid;
            grid-template-columns: 0.25fr 1fr;
            justify-items: start;
            align-items: center;
        }
        
        .${metaName}-row__label {
            font-size: 10px;
            color: var(--text-label);
            white-space: nowrap;
            flex-shrink: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .${metaName}-row__value {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            text-align: right;
            word-break: break-word;
            line-height: 1.4;
        }
        
        .${metaName}-row__value--dim {
            color: var(--text-dim);
        }
        
        .${metaName}-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid;
        }
        
        .${metaName}-badge--on {
            color: #00ff88;
            border-color: rgba(0, 255, 136, 0.5);
            background: rgba(0, 255, 136, 0.1);
        }
        
        .${metaName}-badge--off {
            color: #ff2d95;
            border-color: rgba(255, 45, 149, 0.5);
            background: rgba(255, 45, 149, 0.1);
        }
        
        .${metaName}-badge--on::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #00ff88;
        }
        
        .${metaName}-badge--off::before {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #ff2d95;
        }
        
        .${metaName}-tables {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 300px;
            overflow-y: auto;
            padding-right: 8px;
        }
        
        .${metaName}-tables::-webkit-scrollbar {
            width: 2px;
        }
        
        .${metaName}-tables::-webkit-scrollbar-track {
            background: rgba(0, 212, 255, 0.05);
        }
        
        .${metaName}-tables::-webkit-scrollbar-thumb {
            background: linear-gradient(var(--cyber-blue), var(--cyber-purple));
            border-radius: 2px;
        }
        
        .${metaName}-table-entry {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
            border: 1px solid rgba(0, 212, 255, 0.15);
            border-radius: 6px;
            background: rgba(0, 212, 255, 0.03);
        }
        
        .${metaName}-table-entry__name {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
            word-break: break-word;
        }
        
        .${metaName}-table-entry__meta {
            display: grid;
            gap: 4px;
        }
        
        .${metaName}-table-entry__tag {
            font-size: 9px;
            color: var(--text-label);
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .${metaName}-table-entry__tag span {
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .${metaName}-sub-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--cyber-blue);
            margin-top: 8px;
            margin-bottom: 4px;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(0, 212, 255, 0.3);
            font-weight: 700;
        }
        
        .${metaName}-error-compact {
            margin-top: 12px;
            border-radius: 6px;
            background: rgba(255, 45, 149, 0.08);
            border-left: 2px solid #ff2d95;
        }
        
        .${metaName}-error-compact__header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            font-size: 9px;
            font-weight: 600;
            color: #ff2d95;
            border-bottom: 1px solid rgba(255, 45, 149, 0.2);
        }
        
        .${metaName}-error-compact__body {
            max-height: 80px;
            overflow-y: auto;
            padding: 8px 10px;
        }
        
        .${metaName}-error-compact__exception {
            font-size: 9px;
            font-family: monospace;
            color: #ff6baf;
            line-height: 1.4;
            word-break: break-word;
            white-space: pre-wrap;
        }
        
        .${metaName}-error-compact__body::-webkit-scrollbar {
            width: 2px;
        }
        
        .${metaName}-error-compact__body::-webkit-scrollbar-track {
            background: rgba(255, 45, 149, 0.1);
        }
        
        .${metaName}-error-compact__body::-webkit-scrollbar-thumb {
            background: #ff2d95;
            border-radius: 2px;
        }
        
        .${metaName}-permissions-trigger {
            margin-top: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: rgba(181, 54, 255, 0.06);
            border: 1px solid rgba(181, 54, 255, 0.2);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .${metaName}-permissions-trigger::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, 
                transparent, 
                rgba(181, 54, 255, 0.08), 
                transparent
            );
            transform: translateX(-100%);
            transition: transform 0.6s ease;
        }
        
        .${metaName}-permissions-trigger:hover::before {
            transform: translateX(100%);
        }
        
        .${metaName}-permissions-trigger:hover {
            background: rgba(181, 54, 255, 0.12);
            border-color: rgba(181, 54, 255, 0.45);
            box-shadow: 0 0 24px rgba(181, 54, 255, 0.15);
        }
        
        .${metaName}-permissions-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--cyber-purple);
            flex-shrink: 0;
            animation: permPulse 2s infinite;
        }
        
        @keyframes permPulse {
            0%, 100% { opacity: 0.4; box-shadow: 0 0 3px var(--cyber-purple); }
            50% { opacity: 1; box-shadow: 0 0 10px var(--cyber-purple); }
        }
        
        .${metaName}-permissions-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
        }
        
        .${metaName}-permissions-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: #b8b8ff;
        }
        
        .${metaName}-permissions-stats {
            display: flex;
            gap: 8px;
        }
        
        .${metaName}-perm-stat {
            font-size: 10px;
            color: var(--text-label);
            font-weight: 500;
        }
        
        .${metaName}-perm-stat--warn {
            color: var(--cyber-warn);
        }
        
        .${metaName}-permissions-arrow {
            font-size: 8px;
            color: rgba(181, 54, 255, 0.5);
            transition: transform 0.3s ease;
            flex-shrink: 0;
        }
        
        .${metaName}-permissions-trigger:hover .${metaName}-permissions-arrow {
            transform: translateX(3px);
            color: rgba(181, 54, 255, 1);
        }
        
        .${metaName}-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(5, 5, 15, 0.85);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: overlayIn 0.2s ease;
        }
        
        @keyframes overlayIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .${metaName}-modal {
            width: 680px;
            max-height: 80vh;
            background: linear-gradient(160deg, 
                rgba(18, 18, 31, 0.99) 0%, 
                rgba(10, 10, 20, 0.99) 100%
            );
            border: 1px solid rgba(181, 54, 255, 0.3);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: modalSlide 0.25s ease;
        }
        
        @keyframes modalSlide {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .${metaName}-modal__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(181, 54, 255, 0.2);
            background: rgba(181, 54, 255, 0.04);
            flex-shrink: 0;
        }
        
        .${metaName}-modal__header-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .${metaName}-modal__title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #d0d0ff;
            text-transform: uppercase;
        }
        
        .${metaName}-modal__badge {
            font-size: 9px;
            color: var(--text-label);
            background: rgba(181, 54, 255, 0.1);
            padding: 2px 8px;
            border-radius: 10px;
            border: 1px solid rgba(181, 54, 255, 0.2);
        }
        
        .${metaName}-modal__close {
            width: 28px;
            height: 28px;
            border: 1px solid rgba(255, 45, 149, 0.3);
            background: rgba(255, 45, 149, 0.08);
            color: #ff6b9d;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .${metaName}-modal__close:hover {
            background: rgba(255, 45, 149, 0.2);
            border-color: rgba(255, 45, 149, 0.6);
            color: #ff2d95;
        }
        
        .${metaName}-modal__body {
            padding: 16px 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .${metaName}-modal__body::-webkit-scrollbar {
            width: 3px;
        }
        
        .${metaName}-modal__body::-webkit-scrollbar-track {
            background: rgba(181, 54, 255, 0.05);
        }
        
        .${metaName}-modal__body::-webkit-scrollbar-thumb {
            background: linear-gradient(var(--cyber-purple), var(--cyber-blue));
            border-radius: 2px;
        }
        
        .${metaName}-modal__summary {
            margin-bottom: 16px;
        }
        
        .${metaName}-summary-row {
            display: flex;
            gap: 12px;
        }
        
        .${metaName}-summary-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 10px;
            background: rgba(0, 212, 255, 0.04);
            border: 1px solid rgba(0, 212, 255, 0.15);
            border-radius: 8px;
        }
        
        .${metaName}-summary-item--warn {
            background: rgba(255, 179, 71, 0.06);
            border-color: rgba(255, 179, 71, 0.25);
        }
        
        .${metaName}-summary-value {
            font-size: 22px;
            font-weight: 700;
            color: var(--text-primary);
            font-family: monospace;
        }
        
        .${metaName}-summary-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-label);
            margin-top: 2px;
            font-weight: 600;
        }
        
        .${metaName}-permissions-table-wrap {
            max-height: 350px;
            overflow-y: auto;
            padding-right: 4px;
        }
        
        .${metaName}-permissions-table-wrap::-webkit-scrollbar {
            width: 3px;
        }
        
        .${metaName}-permissions-table-wrap::-webkit-scrollbar-track {
            background: rgba(0, 212, 255, 0.05);
        }
        
        .${metaName}-permissions-table-wrap::-webkit-scrollbar-thumb {
            background: linear-gradient(var(--cyber-blue), var(--cyber-purple));
            border-radius: 2px;
        }
        
        .${metaName}-permissions-table {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .${metaName}-perm-row {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: rgba(0, 212, 255, 0.02);
            border: 1px solid rgba(0, 212, 255, 0.08);
            border-radius: 6px;
            transition: all 0.2s;
            gap: 12px;
        }
        
        .${metaName}-perm-row:hover {
            background: rgba(0, 212, 255, 0.05);
            border-color: rgba(0, 212, 255, 0.2);
        }
        
        .${metaName}-perm-row--conflict {
            background: rgba(255, 179, 71, 0.05);
            border-color: rgba(255, 179, 71, 0.2);
        }
        
        .${metaName}-perm-row--conflict:hover {
            background: rgba(255, 179, 71, 0.1);
            border-color: rgba(255, 179, 71, 0.35);
        }
        
        .${metaName}-perm-row__user {
            display: flex;
            flex-direction: column;
            gap: 1px;
            flex: 1;
            min-width: 0;
        }
        
        .${metaName}-perm-row__name {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .${metaName}-perm-row__type {
            font-size: 8px;
            color: var(--text-label);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 600;
        }
        
        .${metaName}-perm-row__perms {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        
        .${metaName}-perm-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            min-width: 50px;
            text-align: center;
        }
        
        .${metaName}-perm-badge--dash {
            background: rgba(181, 54, 255, 0.15);
            color: #c08dff;
            border: 1px solid rgba(181, 54, 255, 0.35);
        }
        
        .${metaName}-perm-badge--ds {
            background: rgba(0, 180, 255, 0.12);
            color: #6db3ff;
            border: 1px solid rgba(0, 180, 255, 0.3);
        }
        
        .${metaName}-perm-badge--empty {
            opacity: 0.35;
            border-style: dashed;
        }
        
        .${metaName}-perm-badge--conflict {
            animation: conflictPulse 1.5s infinite;
        }
        
        @keyframes conflictPulse {
            0%, 100% { border-color: rgba(255, 179, 71, 0.3); }
            50% { border-color: rgba(255, 179, 71, 0.7); }
        }
        
        .${metaName}-perm-arrow {
            color: var(--text-label);
            font-size: 10px;
        }
        
        .${metaName}-perm-row__conflict-icon {
            font-size: 14px;
            flex-shrink: 0;
            animation: conflictIconPulse 1s infinite;
        }
        
        @keyframes conflictIconPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        
        .${metaName}-perm-controls {
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            background: rgba(0, 212, 255, 0.03);
            border: 1px solid rgba(0, 212, 255, 0.1);
            border-radius: 8px;
        }
        
        .${metaName}-perm-controls__search {
            position: relative;
            width: 100%;
        }
        
        .${metaName}-perm-search-input {
            width: 100%;
            padding: 8px 12px 8px 32px;
            background: rgba(10, 10, 15, 0.8);
            border: 1px solid rgba(0, 212, 255, 0.2);
            border-radius: 6px;
            color: var(--text-primary);
            font-size: 12px;
            font-family: inherit;
            outline: none;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        
        .${metaName}-perm-search-input::placeholder {
            color: var(--text-label);
            opacity: 0.6;
        }
        
        .${metaName}-perm-search-input:focus {
            border-color: rgba(0, 212, 255, 0.5);
            box-shadow: 0 0 12px rgba(0, 212, 255, 0.1);
            background: rgba(10, 10, 15, 0.95);
        }
        
        .${metaName}-perm-search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--cyber-blue);
            font-size: 16px;
            opacity: 0.6;
            pointer-events: none;
        }
        
        .${metaName}-perm-controls__filters,
        .${metaName}-perm-controls__sort {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
        
        .${metaName}-perm-filter-btn,
        .${metaName}-perm-sort-btn {
            padding: 4px 10px;
            background: rgba(0, 212, 255, 0.05);
            border: 1px solid rgba(0, 212, 255, 0.15);
            border-radius: 4px;
            color: var(--text-secondary);
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-family: inherit;
            white-space: nowrap;
        }
        
        .${metaName}-perm-filter-btn:hover,
        .${metaName}-perm-sort-btn:hover {
            background: rgba(0, 212, 255, 0.1);
            border-color: rgba(0, 212, 255, 0.3);
            color: var(--text-primary);
        }
        
        .${metaName}-perm-filter-btn--active,
        .${metaName}-perm-sort-btn--active {
            background: rgba(0, 212, 255, 0.15);
            border-color: rgba(0, 212, 255, 0.4);
            color: var(--cyber-blue);
            box-shadow: 0 0 8px rgba(0, 212, 255, 0.15);
        }
        
    </style>`
}

function renderCharts(id, dataset){
    const cnt = $('#' + id)
    const { 
        moreInfoDataset, schedulerSX, targetSX, tables,
        permissionDashboard, permissionsDataset
    } = dataset
    
    const datasetHTML = getInfoDataset(moreInfoDataset)
    const shedulerHTML = getInfoSheduler(schedulerSX[0])
    const dashboardHTML = getInfoDashboard(targetSX, permissionDashboard, permissionsDataset)
    const tablesHTML = getInfoTables(tables)
    
    const html = `
    <div class="${metaName}-grid">
        <div class="${metaName}-cell">${datasetHTML}</div>
        <div class="${metaName}-cell">${shedulerHTML}</div>
        <div class="${metaName}-cell">${dashboardHTML}</div>
        <div class="${metaName}-cell">${tablesHTML}</div>
    </div>`
    
    cnt.append(html)
    
    cnt.off('click', `.${metaName}-permissions-trigger`).on('click', `.${metaName}-permissions-trigger`, function(e) {
        e.preventDefault()
        e.stopPropagation()
        
        const $trigger = $(this)
        const dashPerms = JSON.parse($trigger.attr('data-dash-perms'))
        const dsPerms = JSON.parse($trigger.attr('data-ds-perms'))
        
        showPermissionsModal(id, dashPerms, dsPerms)
    })
}

function getInfoDataset(data){
    const {modifiedBy, modifiedTime, relationships, version} = data

    return `
    <div class="${metaName}-cell__head">
        <div class="${metaName}-cell__dot ${metaName}-cell__dot--ds"></div>
        <div class="${metaName}-cell__title">[ Dataset ]</div>
    </div>
    <div class="${metaName}-cell__body">
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ editor</span>
            <span class="${metaName}-row__value">${escapeHtml(modifiedBy)}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ updated</span>
            <span class="${metaName}-row__value">${fdate(modifiedTime,'dd.mm.yyyy HH:mm')}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ relations</span>
            <span class="${metaName}-row__value">${relationships.length}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ version</span>
            <span class="${metaName}-row__value ${metaName}-row__value--dim">v${version}</span>
        </div>
    </div>`
}

function getInfoSheduler(data){
    const {crons, failedJob, isEnabled, lastJobState, lastExecution, nextExecution, utcOffset} = data
    const parsedCrons = cronParser(crons[0])
    
    const statusHtml = isEnabled 
        ? `<span class="${metaName}-badge ${metaName}-badge--on">● active</span>`
        : `<span class="${metaName}-badge ${metaName}-badge--off">● inactive</span>`
    
    return `
    <div class="${metaName}-cell__head">
        <div class="${metaName}-cell__dot ${metaName}-cell__dot--sch"></div>
        <div class="${metaName}-cell__title">[ Scheduler ]</div>
    </div>
    <div class="${metaName}-cell__body">
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ status</span>
            <span class="${metaName}-row__value">${statusHtml}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ cron</span>
            <span class="${metaName}-row__value">${escapeHtml(parsedCrons)}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ last run</span>
            <span class="${metaName}-row__value">${fdate(lastExecution,'dd.mm.yyyy HH:mm')}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ next run</span>
            <span class="${metaName}-row__value">${fdate(nextExecution,'dd.mm.yyyy HH:mm')}</span>
        </div>
        ${failedJob ? `
        <div class="${metaName}-error-compact">
            <div class="${metaName}-error-compact__header">
                <span>⚠</span>
                <span>${fdate(failedJob.failedAt,'dd.mm.yyyy HH:MM')}</span>
                <span class="${metaName}-error-compact__jobid">#${failedJob.jobId}</span>
            </div>
            <div class="${metaName}-error-compact__body">
                <div class="${metaName}-error-compact__exception">${escapeHtml(failedJob.exception)}</div>
            </div>
        </div>` : ''}
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ utc</span>
            <span class="${metaName}-row__value ${metaName}-row__value--dim">${utcOffset}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ job state</span>
            <span class="${metaName}-row__value ${metaName}-row__value--dim">${lastJobState}</span>
        </div>
    </div>`
}

function getInfoDashboard(data, permissionsDashboard, permissionsDataset){
    const {lastEditorName, lastModified, isPublic, publishedOnPortal} = data
    
    const pubHtml = isPublic 
        ? `<span class="${metaName}-badge ${metaName}-badge--on">● public</span>`
        : `<span class="${metaName}-badge ${metaName}-badge--off">● private</span>`
    
    const permStats = getPermissionsStats(permissionsDashboard, permissionsDataset)
    
    const dashPermsEncoded = JSON.stringify(permissionsDashboard).replace(/"/g, '&quot;')
    const dsPermsEncoded = JSON.stringify(permissionsDataset).replace(/"/g, '&quot;')
    
    const permissionsIndicator = `
        <div class="${metaName}-permissions-trigger" 
             data-dash-perms="${dashPermsEncoded}" 
             data-ds-perms="${dsPermsEncoded}">
            <div class="${metaName}-permissions-dot"></div>
            <div class="${metaName}-permissions-info">
                <span class="${metaName}-permissions-label">ACCESS CONTROL</span>
                <span class="${metaName}-permissions-stats">
                    <span class="${metaName}-perm-stat">${permStats.total} users</span>
                    ${permStats.conflicts > 0 ? `<span class="${metaName}-perm-stat ${metaName}-perm-stat--warn">${permStats.conflicts} ⚡</span>` : ''}
                </span>
            </div>
            <div class="${metaName}-permissions-arrow">▶</div>
        </div>`
    
    return `
    <div class="${metaName}-cell__head">
        <div class="${metaName}-cell__dot ${metaName}-cell__dot--dash"></div>
        <div class="${metaName}-cell__title">[ Dashboard ]</div>
    </div>
    <div class="${metaName}-cell__body">
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ editor</span>
            <span class="${metaName}-row__value">${escapeHtml(lastEditorName)}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ saved</span>
            <span class="${metaName}-row__value">${fdate(lastModified,'dd.mm.yyyy HH:mm')}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ access</span>
            <span class="${metaName}-row__value">${pubHtml}</span>
        </div>
        <div class="${metaName}-row">
            <span class="${metaName}-row__label">⟫ portal</span>
            <span class="${metaName}-row__value ${metaName}-row__value--dim">${publishedOnPortal ? '✓ true' : '✗ false'}</span>
        </div>
        ${permissionsIndicator}
    </div>`
}

function getPermissionsStats(dashPerms, dsPerms) {
    const dashUsers = new Map(dashPerms.map(p => [p.username, p.assignedPermission]))
    const dsUsers = new Map(dsPerms.map(p => [p.username, p.assignedPermissions[0]]))
    
    const allUsers = new Set([...dashUsers.keys(), ...dsUsers.keys()])
    let conflicts = 0
    
    allUsers.forEach(username => {
        const dashPerm = dashUsers.get(username)
        const dsPerm = dsUsers.get(username)
        if (dashPerm && dsPerm && dashPerm !== dsPerm) conflicts++
    })
    
    return {
        total: allUsers.size,
        conflicts: conflicts
    }
}

function showPermissionsModal(containerId, dashPerms, dsPerms) {
    const cntBody = document.body
    const permissionsMatrix = crossPermissions(dashPerms, dsPerms)
    
    // Сохраняем данные в переменные, а не в DOM
    let currentData = permissionsMatrix
    let currentFilter = 'all'
    let currentSort = { field: 'name', order: 'asc' }
    let currentSearchTerm = ''
    
    const existingModal = $(`.${metaName}-modal-overlay`)
    if (existingModal.length) existingModal.remove()
    
    const modal = document.createElement('div')
    modal.className = `${metaName}-modal-overlay`
    
    modal.innerHTML = `
        <div class="${metaName}-modal">
            <div class="${metaName}-modal__header">
                <div class="${metaName}-modal__header-left">
                    <div class="${metaName}-cell__dot ${metaName}-cell__dot--dash" style="margin: 0 8px 0 0;"></div>
                    <span class="${metaName}-modal__title">ACCESS CONTROL MATRIX</span>
                    <span class="${metaName}-modal__badge" id="${metaName}-perm-count">${currentData.length} subjects</span>
                </div>
                <button class="${metaName}-modal__close">×</button>
            </div>
            <div class="${metaName}-modal__body">
                <div class="${metaName}-modal__summary" id="${metaName}-perm-summary">
                    ${getSummaryHTML(currentData)}
                </div>
                
                <div class="${metaName}-perm-controls">
                    <div class="${metaName}-perm-controls__search">
                        <input type="text" id="${metaName}-perm-search" class="${metaName}-perm-search-input" placeholder="Search by username...">
                        <span class="${metaName}-perm-search-icon">⌕</span>
                    </div>
                    <div class="${metaName}-perm-controls__filters">
                        <button class="${metaName}-perm-filter-btn ${metaName}-perm-filter-btn--active" data-filter="all">All</button>
                        <button class="${metaName}-perm-filter-btn" data-filter="conflict">⚠ Conflicts</button>
                        <button class="${metaName}-perm-filter-btn" data-filter="dash_only">Dash Only</button>
                        <button class="${metaName}-perm-filter-btn" data-filter="ds_only">DS Only</button>
                        <button class="${metaName}-perm-filter-btn" data-filter="both">Both</button>
                    </div>
                    <div class="${metaName}-perm-controls__sort">
                        <button class="${metaName}-perm-sort-btn ${metaName}-perm-sort-btn--active" data-sort="name">Name ↑</button>
                        <button class="${metaName}-perm-sort-btn" data-sort="type">Type ↕</button>
                        <button class="${metaName}-perm-sort-btn" data-sort="permissions">Permissions ↕</button>
                    </div>
                </div>
                
                <div class="${metaName}-permissions-table-wrap" id="${metaName}-perm-table-container">
                    ${getPermissionsTableHTML(currentData)}
                </div>
            </div>
        </div>`
    
    cntBody.appendChild(modal)
    
    const $modal = $(modal)
    
    // Функция обновления UI
    const refreshUI = () => {
        // Фильтрация
        let filtered = currentData.filter(item => {
            const username = (item.username || '').toLowerCase()
            const matchesSearch = !currentSearchTerm || username.includes(currentSearchTerm)
            
            let matchesFilter = true
            switch (currentFilter) {
                case 'conflict':
                    matchesFilter = item.hasConflict === true
                    break
                case 'dash_only':
                    matchesFilter = item.inDashboard === true && item.inDataset === false
                    break
                case 'ds_only':
                    matchesFilter = item.inDataset === true && item.inDashboard === false
                    break
                case 'both':
                    matchesFilter = item.inDashboard === true && item.inDataset === true && !item.hasConflict
                    break
                default:
                    matchesFilter = true
            }
            return matchesSearch && matchesFilter
        })
        
        // Сортировка
        filtered.sort((a, b) => {
            let valA, valB
            switch (currentSort.field) {
                case 'name':
                    valA = (a.username || '').toLowerCase()
                    valB = (b.username || '').toLowerCase()
                    break
                case 'type':
                    valA = (a.subjectType || '').toLowerCase()
                    valB = (b.subjectType || '').toLowerCase()
                    break
                case 'permissions':
                    const getWeight = (item) => (item.inDashboard ? 1 : 0) + (item.inDataset ? 1 : 0)
                    valA = getWeight(a)
                    valB = getWeight(b)
                    break
                default:
                    valA = a.username || ''
                    valB = b.username || ''
            }
            if (typeof valA === 'string') {
                const cmp = valA.localeCompare(valB)
                return currentSort.order === 'asc' ? cmp : -cmp
            }
            return currentSort.order === 'asc' ? valA - valB : valB - valA
        })
        
        // Обновляем DOM
        $modal.find(`#${metaName}-perm-table-container`).html(getPermissionsTableHTML(filtered))
        $modal.find(`#${metaName}-perm-count`).text(`${filtered.length} subjects`)
        
        const conflicts = filtered.filter(i => i.hasConflict).length
        const onlyDash = filtered.filter(i => i.inDashboard && !i.inDataset).length
        const onlyDS = filtered.filter(i => i.inDataset && !i.inDashboard).length
        
        $modal.find(`#${metaName}-perm-summary`).html(`
            <div class="${metaName}-summary-row">
                <div class="${metaName}-summary-item">
                    <div class="${metaName}-summary-value">${filtered.length}</div>
                    <div class="${metaName}-summary-label">Total</div>
                </div>
                ${conflicts > 0 ? `
                <div class="${metaName}-summary-item ${metaName}-summary-item--warn">
                    <div class="${metaName}-summary-value">${conflicts}</div>
                    <div class="${metaName}-summary-label">Conflicts</div>
                </div>` : ''}
                <div class="${metaName}-summary-item">
                    <div class="${metaName}-summary-value">${onlyDash}</div>
                    <div class="${metaName}-summary-label">Dash Only</div>
                </div>
                <div class="${metaName}-summary-item">
                    <div class="${metaName}-summary-value">${onlyDS}</div>
                    <div class="${metaName}-summary-label">Data Only</div>
                </div>
            </div>
        `)
    }
    
    // Закрытие
    $modal.find(`.${metaName}-modal__close`).on('click', () => $modal.remove())
    $modal.on('click', (e) => {
        if ($(e.target).hasClass(`${metaName}-modal-overlay`)) $modal.remove()
    })
    
    // Поиск
    $modal.find(`#${metaName}-perm-search`).on('input', function() {
        currentSearchTerm = this.value.toLowerCase()
        refreshUI()
    })
    
    // Фильтры
    $modal.find(`.${metaName}-perm-filter-btn`).on('click', function() {
        currentFilter = $(this).data('filter')
        $modal.find(`.${metaName}-perm-filter-btn`).removeClass(`${metaName}-perm-filter-btn--active`)
        $(this).addClass(`${metaName}-perm-filter-btn--active`)
        refreshUI()
    })
    
    // Сортировка
    $modal.find(`.${metaName}-perm-sort-btn`).on('click', function() {
        const newField = $(this).data('sort')
        
        if (currentSort.field === newField) {
            currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc'
        } else {
            currentSort = { field: newField, order: 'asc' }
        }
        
        $modal.find(`.${metaName}-perm-sort-btn`).removeClass(`${metaName}-perm-sort-btn--active`)
        $(this).addClass(`${metaName}-perm-sort-btn--active`)
        
        $modal.find(`.${metaName}-perm-sort-btn`).each(function() {
            const field = $(this).data('sort')
            if ($(this).hasClass(`${metaName}-perm-sort-btn--active`)) {
                $(this).text(`${field.charAt(0).toUpperCase() + field.slice(1)} ${currentSort.order === 'asc' ? '↑' : '↓'}`)
            } else {
                $(this).text(`${field.charAt(0).toUpperCase() + field.slice(1)} ↕`)
            }
        })
        
        refreshUI()
    })
}

function updateModalContent($modal) {
    const containerEl = $modal.find(`#${metaName}-perm-table-container`)[0]
    const searchInput = $modal.find(`#${metaName}-perm-search`)[0]
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : ''
    
    const currentFilter = containerEl.dataset.currentFilter || 'all'
    const currentSort = JSON.parse(containerEl.dataset.currentSort || '{"field":"name","order":"asc"}')
    const originalData = JSON.parse(containerEl.dataset.originalData)
    
    // Фильтрация
    let filteredData = originalData.filter(item => {
        const username = (item.username || '').toLowerCase()
        const matchesSearch = !searchTerm || username.includes(searchTerm)
        
        let matchesFilter = true
        switch (currentFilter) {
            case 'conflict':
                matchesFilter = item.hasConflict === true
                break
            case 'dash_only':
                matchesFilter = item.inDashboard === true && item.inDataset === false
                break
            case 'ds_only':
                matchesFilter = item.inDataset === true && item.inDashboard === false
                break
            case 'both':
                matchesFilter = item.inDashboard === true && item.inDataset === true && !item.hasConflict
                break
            case 'all':
            default:
                matchesFilter = true
        }
        
        return matchesSearch && matchesFilter
    })
    
    // Сортировка
    filteredData.sort((a, b) => {
        let valA, valB
        
        switch (currentSort.field) {
            case 'name':
                valA = (a.username || '').toLowerCase()
                valB = (b.username || '').toLowerCase()
                break
            case 'type':
                valA = (a.subjectType || '').toLowerCase()
                valB = (b.subjectType || '').toLowerCase()
                break
            case 'permissions':
                const getWeight = (item) => {
                    let weight = 0
                    if (item.inDashboard && item.dashboard) weight += 1
                    if (item.inDataset && item.dataset) weight += 1
                    return weight
                }
                valA = getWeight(a)
                valB = getWeight(b)
                break
            default:
                valA = a.username || ''
                valB = b.username || ''
        }
        
        if (typeof valA === 'string') {
            const cmp = valA.localeCompare(valB)
            return currentSort.order === 'asc' ? cmp : -cmp
        } else {
            return currentSort.order === 'asc' ? valA - valB : valB - valA
        }
    })
    
    // Обновляем UI
    $modal.find(`#${metaName}-perm-table-container`).html(getPermissionsTableHTML(filteredData))
    $modal.find(`#${metaName}-perm-count`).text(`${filteredData.length} subjects`)
    
    // Обновляем сводку
    const conflicts = filteredData.filter(i => i.hasConflict).length
    const onlyDash = filteredData.filter(i => i.inDashboard && !i.inDataset).length
    const onlyDS = filteredData.filter(i => i.inDataset && !i.inDashboard).length
    
    $modal.find(`#${metaName}-perm-summary`).html(`
        <div class="${metaName}-summary-row">
            <div class="${metaName}-summary-item">
                <div class="${metaName}-summary-value">${filteredData.length}</div>
                <div class="${metaName}-summary-label">Total</div>
            </div>
            ${conflicts > 0 ? `
            <div class="${metaName}-summary-item ${metaName}-summary-item--warn">
                <div class="${metaName}-summary-value">${conflicts}</div>
                <div class="${metaName}-summary-label">Conflicts</div>
            </div>` : ''}
            <div class="${metaName}-summary-item">
                <div class="${metaName}-summary-value">${onlyDash}</div>
                <div class="${metaName}-summary-label">Dash Only</div>
            </div>
            <div class="${metaName}-summary-item">
                <div class="${metaName}-summary-value">${onlyDS}</div>
                <div class="${metaName}-summary-label">Data Only</div>
            </div>
        </div>
    `)
}

function crossPermissions(dashPerms, dsPerms) {
    const matrix = new Map()
    
    // Добавляем все права из dashboard
    dashPerms.forEach(perm => {
        matrix.set(perm.username, {
            username: perm.username,
            subjectType: perm.subjectType,
            dashboard: perm.assignedPermission,
            dataset: null,
            hasConflict: false,
            inDashboard: true,
            inDataset: false
        })
    })
    
    // Добавляем/обновляем из dataset
    dsPerms.forEach(perm => {
        const dsPermValue = perm.assignedPermissions[0]
        const existing = matrix.get(perm.username)
        
        if (existing) {
            existing.dataset = dsPermValue
            existing.inDataset = true
            existing.hasConflict = existing.dashboard !== dsPermValue
        } else {
            matrix.set(perm.username, {
                username: perm.username,
                subjectType: perm.subjectType,
                dashboard: null,
                dataset: dsPermValue,
                hasConflict: false,
                inDashboard: false,
                inDataset: true
            })
        }
    })
    
    return Array.from(matrix.values())
}

function getSummaryHTML(matrix) {
    const total = matrix.length
    const conflicts = matrix.filter(m => m.hasConflict).length
    const onlyDash = matrix.filter(m => m.inDashboard && !m.inDataset).length
    const onlyDS = matrix.filter(m => m.inDataset && !m.inDashboard).length
    
    return `
        <div class="${metaName}-summary-row">
            <div class="${metaName}-summary-item">
                <span class="${metaName}-summary-value">${total}</span>
                <span class="${metaName}-summary-label">Total</span>
            </div>
            ${conflicts > 0 ? `
            <div class="${metaName}-summary-item ${metaName}-summary-item--warn">
                <span class="${metaName}-summary-value">${conflicts}</span>
                <span class="${metaName}-summary-label">Conflicts</span>
            </div>` : ''}
            <div class="${metaName}-summary-item">
                <span class="${metaName}-summary-value">${onlyDash}</span>
                <span class="${metaName}-summary-label">Dash Only</span>
            </div>
            <div class="${metaName}-summary-item">
                <span class="${metaName}-summary-value">${onlyDS}</span>
                <span class="${metaName}-summary-label">Data Only</span>
            </div>
        </div>`
}

function getPermissionsTableHTML(matrix) {
    if (!matrix || matrix.length === 0) {
        return `<div class="${metaName}-permissions-table" style="text-align: center; padding: 40px; color: var(--text-label);">No matching users found</div>`
    }
    
    const rows = matrix.map(m => `
        <div class="${metaName}-perm-row ${m.hasConflict ? metaName + '-perm-row--conflict' : ''}">
            <div class="${metaName}-perm-row__user">
                <span class="${metaName}-perm-row__name">${escapeHtml(m.username)}</span>
                <span class="${metaName}-perm-row__type">${escapeHtml(m.subjectType)}</span>
            </div>
            <div class="${metaName}-perm-row__perms">
                <div class="${metaName}-perm-badge ${metaName}-perm-badge--dash 
                    ${!m.inDashboard ? metaName + '-perm-badge--empty' : ''} 
                    ${m.hasConflict ? metaName + '-perm-badge--conflict' : ''}">
                    ${m.inDashboard ? escapeHtml(m.dashboard) : '—'}
                </div>
                <div class="${metaName}-perm-arrow">→</div>
                <div class="${metaName}-perm-badge ${metaName}-perm-badge--ds 
                    ${!m.inDataset ? metaName + '-perm-badge--empty' : ''} 
                    ${m.hasConflict ? metaName + '-perm-badge--conflict' : ''}">
                    ${m.inDataset ? escapeHtml(m.dataset) : '—'}
                </div>
            </div>
            ${m.hasConflict ? `<div class="${metaName}-perm-row__conflict-icon">⚡</div>` : ''}
        </div>`
    ).join('')
    
    return `<div class="${metaName}-permissions-table">${rows}</div>`
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function getInfoTables(data){
    
    const findPhysics = data.filter(v=>v.tableData)
    const sqlTables = data.filter(v=>!v.tableData)
    
    const physicsHTML = getPhysicsHTML(findPhysics)
    const sqlHTML = getSqlHTML(sqlTables)
    
    return `
    <div class="${metaName}-cell__head">
        <div class="${metaName}-cell__dot ${metaName}-cell__dot--tbl"></div>
        <div class="${metaName}-cell__title">[ Tables ]</div>
    </div>
    <div class="${metaName}-cell__body ${metaName}-tables">
        ${physicsHTML}
        ${sqlHTML}
    </div>`
    
    function getPhysicsHTML(data){
        if (data.length === 0) return ''
        
        let htmlX = `<div class="${metaName}-sub-label">[ Physical Storage ]</div>`
        data.map(v=>{
            const { name, modifiedTime } = v
            const { bucketName, fullPath, timeStamp } = v.tableData
            
            const frmPath = fullPath.replace('/mnt/volume1/','')
            const frmTimeMod = fdate(modifiedTime, 'dd.mm.yyyy HH:mm')
            
            htmlX += `
            <div class="${metaName}-table-entry">
                <div class="${metaName}-table-entry__name">
                    ◈ ${escapeHtml(name)}
                    <span class="${metaName}-table-entry__tag">[${escapeHtml(bucketName)}]</span>
                </div>
                <div class="${metaName}-table-entry__meta">
                    <div class="${metaName}-table-entry__tag">└─ path: ${escapeHtml(frmPath)}</div>
                    <div class="${metaName}-table-entry__tag">└─ modified: <span>${frmTimeMod}</span></div>
                </div>
            </div>`
        })
        return htmlX
    }
    
    function getSqlHTML(data){
        if (data.length === 0) return ''
        
        let htmlX = `<div class="${metaName}-sub-label">[ SQL Views ]</div>`
        data.map(v=>{
            const { name, modifiedTime } = v
            
            const frmTimeMod = fdate(modifiedTime, 'dd.mm.yyyy HH:mm')
            
            htmlX += `
            <div class="${metaName}-table-entry">
                <div class="${metaName}-table-entry__name">◈ ${escapeHtml(name)}</div>
                <div class="${metaName}-table-entry__meta">
                    <div class="${metaName}-table-entry__tag">└─ modified: <span>${frmTimeMod}</span></div>
                </div>
            </div>`
        })
        return htmlX
    }
}