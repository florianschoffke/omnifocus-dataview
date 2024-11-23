const { run } = require('@jxa/run');

async function getTasksWithTagsAndFolders(tags, folderNames) {
    try {
        const jxaScript = (tags, folderNames) => {
            const app = Application('OmniFocus');
            const doc = app.defaultDocument;

            // Function to get all tasks that match any of the specified tags
            const getAllTasksWithTags = (tags) => {
                const tasksWithTags = [];
                tags.forEach(tagName => {
                    const tag = doc.flattenedTags().find(t => t.name() === tagName);
                    if (tag) {
                        const tasks = tag.tasks().map(task => ({
                            name: task.name(),
                            id: task.id(),
                        }));
                        tasksWithTags.push(...tasks);
                    }
                });
                return tasksWithTags;
            };

            // Helper function to check if a project is under any of the specified folders
            const isProjectInFolders = (project, folderNames) => {
                let currentContainer = project;
                while (currentContainer) {
                    const containerName = currentContainer.name();
                    if (containerName === "OmniFocus") {
                        break;
                    }
                    if (folderNames.includes(containerName)) {
                        return true;
                    }
                    // Move up the hierarchy
                    let nextContainer = null;
                    if (typeof currentContainer.containingFolder === 'function') {
                        nextContainer = currentContainer.container();
                    } else if (typeof currentContainer.container === 'function') {
                        nextContainer = currentContainer.container();
                    } else {
                        break;
                    }
                    if (nextContainer && nextContainer !== currentContainer) {
                        currentContainer = nextContainer;
                    } else {
                        break;
                    }
                }
                return false;
            };

            // Function to filter tasks based on whether their projects are in the specified folders
            const filterTasksByFolders = (tasks, folderNames) => {
                return tasks.filter(task => {
                    const project = doc.flattenedProjects().find(p => p.id() === task.projectId);
                    if (project) {
                        return isProjectInFolders(project, folderNames);
                    }
                    return false;
                });
            };

            // Start function: Get all tasks with the specified tags and filter them by folders
            const allTasks = getAllTasksWithTags(tags);
            const matchingTasks = filterTasksByFolders(allTasks, folderNames);

            return JSON.stringify(matchingTasks);
        };

        // Run the JXA script with the specified tags and folder names
        const result = await run(jxaScript, tags, folderNames);
        const tasks = JSON.parse(result);

        // Output the results
        console.log(`Tasks with tags ${tags.join(', ')} in folders ${folderNames.join(', ')}:`);
        tasks.forEach(task => {
            console.log(`- ${task.name} (ID: ${task.id}, Tag: ${task.tag}, Project: ${task.projectName})`);
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Example usage: Pass an array of tag names and an array of folder names
getTasksWithTagsAndFolders(['onGoing'], ['Gematik']);