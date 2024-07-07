//
//  MyCalendarApp.swift
//  MyCalendar
//
//  Created by Bruno  Faria on 07/07/24.
//

import SwiftUI

@main
struct MyCalendarApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
