const BASE_FOLDERS = [
    {id: 1, name: 'المكتبة', parent: null, metadata: {}},
    {id: 2, name: 'المتون', parent: 1, metadata: {}},
    {id: 3, name: 'الشروح', parent: 1, metadata: {}},
    {id: 4, name: 'المشروعات الخاصة', parent: 1, metadata: {}},
    {id: 5, name: 'فريق التحرير', parent: 4, metadata: {}},
]

const generatedFolders = []
let folderId = BASE_FOLDERS.length + 1
for (let chapter = 1; chapter <= 12; chapter++) {
    const parentId = 2
    const chapterId = folderId++
    generatedFolders.push({
        id: chapterId,
        name: `باب ${chapter}`,
        parent: parentId,
        metadata: {},
    })
    for (let sub = 1; sub <= 4; sub++) {
        generatedFolders.push({
            id: folderId++,
            name: `مبحث ${chapter}.${sub}`,
            parent: chapterId,
            metadata: {},
        })
    }
}

export const folders = [...BASE_FOLDERS, ...generatedFolders]

const FILE_TYPES = [
    {id: 1, name: 'مقال'},
    {id: 2, name: 'تفريغ'},
    {id: 3, name: 'مراجعة'},
]

const files = []
let fileId = 100
for (const folder of folders) {
    const items = folder.parent ? 6 : 2
    for (let i = 0; i < items; i++) {
        fileId += 1
        files.push({
            id: fileId,
            name: `${folder.name} — ملف ${i + 1}`,
            file_type: ((i + folder.id) % FILE_TYPES.length) + 1,
            folder: folder.id,
            order: i + 1,
            metadata: {
                system: false,
                is_visible: {review: i % 3 === 0, publish: i % 5 === 0},
            },
            updated_at: new Date(Date.now() - (folder.id + i) * 3600 * 1000).toISOString(),
        })
    }
}

export {FILE_TYPES as file_types,files}

export const users = [
    {id: 1, first_name: 'ليان', last_name: 'السيد'},
    {id: 2, first_name: 'زهراء', last_name: 'المبارك'},
    {id: 3, first_name: 'سارة', last_name: 'الفهد'},
]

export const revisions = files.slice(0, 120).map((file, idx) => ({
    id: idx + 1,
    rev_of: file.id,
    user: (idx % users.length) + 1,
    updated_at: file.updated_at,
}))
