package com.carddrop.app.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.carddrop.app.data.Contact
import com.carddrop.app.data.ContactDao

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactListScreen(dao: ContactDao) {
    val context = LocalContext.current
    val contacts by dao.getAllContacts().collectAsState(initial = emptyList())
    var searchQuery by remember { mutableStateOf("") }

    val filteredContacts = remember(contacts, searchQuery) {
        if (searchQuery.isBlank()) contacts
        else {
            val q = searchQuery.lowercase()
            contacts.filter {
                it.formattedName.lowercase().contains(q) ||
                it.organization.lowercase().contains(q) ||
                it.phoneMobile.contains(q) ||
                it.emailWork.lowercase().contains(q)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Contacts (${filteredContacts.size})", fontWeight = FontWeight.Bold) }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            // Search TextField
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search contacts...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                singleLine = true
            )

            if (filteredContacts.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (searchQuery.isBlank()) "No saved contacts yet.\nScan a QR card to add one!" else "No matching contacts found.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredContacts, key = { it.id }) { contact ->
                        Card(
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(16.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = contact.formattedName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (contact.organization.isNotBlank()) {
                                        Text(
                                            text = "${contact.title.ifBlank { "" }} ${if (contact.title.isNotBlank()) "•" else ""} ${contact.organization}".trim(),
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    if (contact.phoneMobile.isNotBlank()) {
                                        Text(
                                            text = contact.phoneMobile,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }

                                Row {
                                    if (contact.phoneMobile.isNotBlank()) {
                                        IconButton(onClick = {
                                            val dialIntent = Intent(Intent.ACTION_DIAL).apply {
                                                data = Uri.parse("tel:${contact.phoneMobile}")
                                            }
                                            context.startActivity(dialIntent)
                                        }) {
                                            Icon(Icons.Default.Call, contentDescription = "Call")
                                        }
                                    }

                                    if (contact.emailWork.isNotBlank()) {
                                        IconButton(onClick = {
                                            val emailIntent = Intent(Intent.ACTION_SENDTO).apply {
                                                data = Uri.parse("mailto:${contact.emailWork}")
                                            }
                                            context.startActivity(emailIntent)
                                        }) {
                                            Icon(Icons.Default.Email, contentDescription = "Email")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
