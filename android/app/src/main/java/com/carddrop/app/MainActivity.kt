package com.carddrop.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.*
import com.carddrop.app.data.AppDatabase
import com.carddrop.app.ui.ContactListScreen
import com.carddrop.app.ui.MyCardScreen
import com.carddrop.app.ui.QRScannerScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val db = AppDatabase.getDatabase(applicationContext)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme()
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    CardDropApp(db)
                }
            }
        }
    }
}

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object MyCard : Screen("mycard", "My Card", Icons.Default.QrCode2)
    object Scanner : Screen("scanner", "Scan", Icons.Default.CameraAlt)
    object Contacts : Screen("contacts", "Contacts", Icons.Default.Contacts)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CardDropApp(database: AppDatabase) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.MyCard.route

    val screens = listOf(Screen.MyCard, Screen.Scanner, Screen.Contacts)

    Scaffold(
        bottomBar = {
            NavigationBar {
                screens.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            if (currentRoute != screen.route) {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.MyCard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.MyCard.route) {
                MyCardScreen(
                    onNavigateToScanner = {
                        navController.navigate(Screen.Scanner.route)
                    }
                )
            }
            composable(Screen.Scanner.route) {
                QRScannerScreen(
                    onContactSaved = {
                        navController.navigate(Screen.Contacts.route)
                    },
                    dao = database.contactDao()
                )
            }
            composable(Screen.Contacts.route) {
                ContactListScreen(
                    dao = database.contactDao()
                )
            }
        }
    }
}
