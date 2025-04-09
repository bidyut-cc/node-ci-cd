/**
 * @description File to cache all the ACL configuration
 * @author CodeClouds
 */

module.exports = {
    developer: {
        users: {
            all: [
                "createView",
                "add",
                "save",
                "view",
                "edit",
                "update",
                "delete",
                "export",
                "list",
                "upload",
            ],
            group: [
                "createView",
                "add",
                "save",
                "view",
                "update",
                "delete",
                "export",
                "list",
            ],
            owner: [
                "createView",
                "add",
                "save",
                "view",
                "update",
                "delete",
                "export",
                "list",
            ],
        },
        boards: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report","assignMembers","unAssignMembers","members"],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report","assignMembers","unAssignMembers","members"],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report","assignMembers","unAssignMembers","members"],
        },
        lists: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report","move"],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report","move"],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report","move"],
        },
        cards: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report","removeLabels","addAttachments","removeAttachments","moveWithInList","moveBetweenList","updateCardDates","removeCoverImage"],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report","removeLabels","addAttachments","removeAttachments","moveWithInList","moveBetweenList","updateCardDates","removeCoverImage"],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report","removeLabels","addAttachments","removeAttachments","moveWithInList","moveBetweenList","updateCardDates","removeCoverImage"],
        },
        labels: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report"],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report"],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report"],
        },
        checklists: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report",],
        },
        checklistitems: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report",],
        },
        comments: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report",],
        },
        changelogs: {
            all: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            group: ["createView", "add", "save", "view", "update","delete","export","list","report",],
            owner: ["createView", "add", "save", "view", "update","delete","export","list","report",],
        },
        
    },
};
